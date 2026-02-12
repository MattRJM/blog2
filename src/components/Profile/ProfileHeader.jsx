import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { generateAvatar, formatDate, styles } from "../../utils/helpers";

export default function ProfileHeader({
  profile,
  currentUserId,
  isOwnProfile,
  onEditClick,
  onSubscribeClick,
  onMessageClick,
  posts,
}) {
  const [isSubscribed, setIsSubscribed] = useState(
    profile?.subscribers?.includes(currentUserId) || false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState(profile);

  // Real-time listener for profile data
  useEffect(() => {
    if (!profileData?.uid) return;

    const userRef = doc(db, "users", profileData.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfileData({
          uid: profileData.uid,
          ...snapshot.data(),
        });
        setIsSubscribed(
          snapshot.data().subscribers?.includes(currentUserId) || false
        );
      }
    });

    return () => unsubscribe();
  }, [profileData?.uid, currentUserId]);

  if (!profileData)
    return <div style={{ padding: 20 }}>Loading profile...</div>;

  const profileId = profileData.id || profileData.uid || profileData.authorId;

  const postCount = posts?.filter((p) => p.authorId === profileId)?.length || 0;
  const subscribersCount = profileData.subscribers?.length || 0;

  const handleSubscribe = async () => {
    if (!currentUserId || !profileId) {
      console.error("Missing data:", { currentUserId, profileId, profileData });
      alert("Error: missing user data - ID: " + profileId);
      return;
    }

    setIsLoading(true);

    try {
      const userRef = doc(db, "users", currentUserId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error("Current user not found");
        setIsLoading(false);
        return;
      }

      const currentUserData = userSnap.data();
      const currentSubscriptions = currentUserData.subscriptions || [];
      const profileRef = doc(db, "users", profileId);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        console.error("Profile not found at:", profileId);
        setIsLoading(false);
        return;
      }

      const profileDataSnap = profileSnap.data();
      const profileSubscribers = profileDataSnap.subscribers || [];

      if (isSubscribed) {
        // Unsubscribe
        const newSubscriptions = currentSubscriptions.filter(
          (id) => id !== profileId
        );
        await updateDoc(userRef, { subscriptions: newSubscriptions });

        const newSubscribers = profileSubscribers.filter(
          (id) => id !== currentUserId
        );
        await updateDoc(profileRef, { subscribers: newSubscribers });

        console.log("Unsubscribed successfully");
      } else {
        // Subscribe
        if (!currentSubscriptions.includes(profileId)) {
          await updateDoc(userRef, {
            subscriptions: [...currentSubscriptions, profileId],
          });
        }

        if (!profileSubscribers.includes(currentUserId)) {
          await updateDoc(profileRef, {
            subscribers: [...profileSubscribers, currentUserId],
          });
        }

        console.log("Subscribed successfully");
      }

      onSubscribeClick?.(!isSubscribed);
      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error("Error subscribing/unsubscribing:", error);
      alert("Error updating subscription: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 30,
        padding: 20,
        background: "#f9f9f9",
        borderRadius: 8,
      }}
    >
      <div>
        {generateAvatar(
          profileData.name || profileData.email,
          profileData.photoURL,
          80
        )}
        <h2 style={{ margin: "10px 0 5px 0" }}>
          {profileData.name || profileData.email}
        </h2>
        <p style={{ color: "#666", margin: "5px 0" }}>
          {profileData.about || "No bio"}
        </p>
        <small style={{ color: "#999" }}>
          Member since{" "}
          {profileData.createdAt
            ? new Date(
                profileData.createdAt.toDate?.() ||
                  profileData.createdAt?.seconds * 1000 ||
                  profileData.createdAt
              ).toLocaleDateString("en-US")
            : "unknown date"}
        </small>

        <div
          style={{
            marginTop: 15,
            display: "flex",
            gap: 20,
            fontSize: 14,
          }}
        >
          <div>
            <strong>Posts</strong>
            <div style={{ fontSize: 18, fontWeight: "bold" }}>
              {postCount}
            </div>
          </div>
          <div>
            <strong>Subscribers</strong>
            <div style={{ fontSize: 18, fontWeight: "bold" }}>
              {subscribersCount}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {isOwnProfile ? (
          <button
            onClick={onEditClick}
            style={{
              ...styles.button,
              padding: "10px 16px",
            }}
          >
            ✏️ Edit Profile
          </button>
        ) : (
          <>
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              style={{
                ...styles.button,
                padding: "10px 16px",
                background: isSubscribed ? "#dc3545" : "#007bff",
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? "..." : isSubscribed ? "❌ Unsubscribe" : "✅ Subscribe"}
            </button>

            <button
              onClick={onMessageClick}
              style={{
                ...styles.button,
                padding: "10px 16px",
              }}
            >
              💬 Message
            </button>
          </>
        )}
      </div>
    </div>
  );
}
