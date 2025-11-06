import { AllProjects } from "../../components/AllProjects/inde";
import { Card } from "../../components/Card";
import { Main } from "../../components/Main";
import { NavBar } from "../../components/NavBar";
import { Tags } from "../../components/Tags";

export function ProjectsPage() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <NavBar />
      <Main>
        <AllProjects>
          <Card
            title={"POMO"}
            image={"/capa-pomo.png"}
            description={
              "Um temporizador Pomodoro simples e funcional desenvolvido com HTML, CSS e JavaScript. O objetivo é ajudar na produtividade, alternando entre períodos de foco e pausa, com interface limpa, tema escuro e música lo-fi opcional."
            }
            url={"https://pomo-iota-six.vercel.app/"}
          >
            <Tags skill={"JAVASCRIPT"} />
          </Card>
          <Card
            description={
              "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet."
            }
          ></Card>
          <Card
            description={
              "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet."
            }
          ></Card>
          <Card
            description={
              "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet."
            }
          ></Card>
        </AllProjects>
      </Main>
    </div>
  );
}
