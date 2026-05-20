import Header from "@/components/Header";
import ProjectSelector from "@/components/ProjectSelector";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <ProjectSelector />
      </main>
    </>
  );
}
