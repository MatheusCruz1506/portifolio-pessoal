import { Form } from "../../components/Form";
import { Main } from "../../components/Main";
import { NavBar } from "../../components/NavBar";

export function Contact() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <NavBar />
      <Main>
        <Form/>
      </Main>
    </div>
  );
}
