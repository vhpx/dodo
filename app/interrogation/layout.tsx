import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dodo Interrogation | Voice-Powered Crime Drama",
  description: "Can you survive Detective Dodo's interrogation? A voice-powered crime drama game where every word matters.",
};

export default function InterrogationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
