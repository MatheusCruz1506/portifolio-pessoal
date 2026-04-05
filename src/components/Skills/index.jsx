import { ContainerIcon } from "../ContainerIcon";
import {
  CssIcon,
  CssModulesIcon,
  GitHubIcon,
  GitIcon,
  HtmlIcon,
  JsIcon,
  ReactIcon,
  TailWindIcon,
} from "../Icons";

export function Skills() {
  return (
    <section className="flex flex-col gap-[28px] w-full">
      <h2 className=" leading-[26px] text-text-p text-[24px]">Skills</h2>
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(clamp(80px,calc(33.33%_-_40px),120px),_1fr))] gap-x-[120px] gap-y-[60px] max-lg:gap-x-[48px]">
        <ContainerIcon name={"JAVASCRIPT"}>
          <JsIcon />
        </ContainerIcon>

        <ContainerIcon name={"REACT"}>
          <ReactIcon />
        </ContainerIcon>

        <ContainerIcon name={"TAILWIND"}>
          <TailWindIcon />
        </ContainerIcon>

        <ContainerIcon name={"CSS MODULES"}>
          <CssModulesIcon />
        </ContainerIcon>

        <ContainerIcon name={"GIT"}>
          <GitIcon />
        </ContainerIcon>

        <ContainerIcon name={"CSS"}>
          <CssIcon />
        </ContainerIcon>

        <ContainerIcon name={"HTML"}>
          <HtmlIcon />
        </ContainerIcon>

        <ContainerIcon name={"GITHUB"}>
          <GitHubIcon />
        </ContainerIcon>
      </div>
    </section>
  );
}
