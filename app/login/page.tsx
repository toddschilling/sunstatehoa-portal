import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="max-w-md mx-auto mt-20 p-4 border rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Member Login</h1>
      <LoginForm />
    </main>
  );
}
