import { AboutMe } from "../../components/AboutMe";
import { Card } from "../../components/Card";
import { Footer } from "../../components/Footer";
import { Main } from "../../components/Main";
import { Me } from "../../components/Me";
import { NavBar } from "../../components/NavBar";
import { ProjectsHome } from "../../components/ProjectsHome";
import { SeeProjects } from "../../components/SeeProjects";
import { Skills } from "../../components/Skills";
import { Tags } from "../../components/Tags";

export function Home() {
  return (
    <>
      <div className="bg-background min-h-screen flex flex-col">
        <NavBar />
        <Main>
          <Me />
          <AboutMe />
          <ProjectsHome>
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
          </ProjectsHome>
          <div className="flex justify-center mt-[38px] mb-[130px] max-lg:mb-[100px]">
            <SeeProjects />
          </div>
          <Skills />
        </Main>
        <Footer />
      </div>
    </>
  );
}
