"use client";
import { usePathname } from "next/navigation";

export default function Home() {
  const pathname = usePathname();
  console.log(pathname);

  return <div>{pathname}</div>;
}
