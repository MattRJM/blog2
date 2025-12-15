import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { isValidEmail } from "../../utils/helpers";
import { styles } from "../../utils/helpers";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email e senha são obrigatórios");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Email inválido");
      return;
    }

    if (password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Senhas não coincidem");
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password);
    } catch (err) {
      setError(err.message || "Erro ao registrar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
      <h2>Cadastro</h2>

      {error && (
        <div
          style={{
            background: "#fee",
            color: "#c00",
            padding: 10,
            borderRadius: 4,
            marginBottom: 15,
          }}
        >
          {error}
        </div>
      )}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
        disabled={isLoading}
      />

      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
        disabled={isLoading}
      />

      <input
        type="password"
        placeholder="Confirmar Senha"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        style={styles.input}
        disabled={isLoading}
      />

      <button
        type="submit"
        style={{
          ...styles.button,
          width: "100%",
          opacity: isLoading ? 0.6 : 1,
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
        disabled={isLoading}
      >
        {isLoading ? "Cadastrando..." : "Cadastrar"}
      </button>
    </form>
  );
}
