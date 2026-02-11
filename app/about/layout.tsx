import { Source_Serif_4 } from "next/font/google";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
});

export default function AboutLayout({
  children,
}: { children: React.ReactNode }) {
  return <div className={sourceSerif.className}>{children}</div>;
}
