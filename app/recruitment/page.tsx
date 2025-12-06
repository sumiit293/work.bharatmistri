import RegistrationForm from "./RegistrationForm";

export const metadata = {
  title: "Technician Recruitment",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="py-4 px-0">
        <div className="mx-auto max-w-4xl dark:bg-black p-2">
          <RegistrationForm />
        </div>
      </div>
    </main>
  );
}
