import type { Route } from "./+types/home";
import Navbar from "../../components/Navbar";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "Miles Legend" },
    { name: "description", content: "Welcome to the next level of development!" },
  ];
}

export default function Home() {
  return (<div className={'home'}>
        <Navbar />

  </div>
  )
}
