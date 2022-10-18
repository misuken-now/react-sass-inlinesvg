import React from "react";

import { renderStoryCatalog } from "../..";

import { SVG, pathMap } from "./Svg";
import classNames from "./svg.stories.module.scss";
import nameDefaultClassNames from "./name-default.module.scss";
import nameSvgClassNames from "./name.module.scss";

export default { component: SVG, title: "atoms/SVG" };

export const _1_ShowHoverColor = {
  args: { className: classNames.showHoverColor },
};
export const _2_ShowHoverShow = {
  args: { className: classNames.showHoverShow },
};
export const _3_ShowHoverHidden = {
  args: { className: classNames.showHoverHidden },
};
export const _4_ShowClickNone = {
  args: { className: classNames.showClickNone },
};
export const _5_ShowClickNull = {
  args: { className: classNames.showClickNull },
};
export const _6_NoneClickShow = {
  args: { className: classNames.noneClickShow },
};
export const _7_HiddenHoverShow = {
  args: { className: classNames.hiddenHoverShow },
};

export const Catalog = () =>
  renderStoryCatalog(SVG, pathMap, classNames.svgCatalog, true);

export const StylingPattern = () => (
  <>
    <section>
      <h1>Plane & Fill</h1>
      <SVG defaultName="Svg" className={nameDefaultClassNames.plane} />
      &nbsp;
      <SVG className={nameSvgClassNames.plane} />
      &nbsp;
      <SVG defaultName="React" className={nameDefaultClassNames.planeFill} />
      &nbsp;
      <SVG className={nameSvgClassNames.planeFill} />
    </section>
    <section>
      <h1>+ Background</h1>
      <SVG defaultName="Svg" className={nameDefaultClassNames.circle} />
      &nbsp;
      <SVG className={nameSvgClassNames.circle} />
      &nbsp;
      <SVG defaultName="React" className={nameDefaultClassNames.circleFill} />
      &nbsp;
      <SVG className={nameSvgClassNames.circleFill} />
      <br />
      <SVG defaultName="Svg" className={nameDefaultClassNames.square} />
      &nbsp;
      <SVG className={nameSvgClassNames.square} />
      &nbsp;
      <SVG defaultName="React" className={nameDefaultClassNames.squareFill} />
      &nbsp;
      <SVG className={nameSvgClassNames.squareFill} />
    </section>
    <section>
      <h1>+ Border</h1>
      <SVG defaultName="Svg" className={nameDefaultClassNames.circleBorder} />
      &nbsp;
      <SVG className={nameSvgClassNames.circleBorder} />
      &nbsp;
      <SVG
        defaultName="React"
        className={nameDefaultClassNames.circleFillBorder}
      />
      &nbsp;
      <SVG className={nameSvgClassNames.circleFillBorder} />
      <br />
      <SVG defaultName="Svg" className={nameDefaultClassNames.squareBorder} />
      &nbsp;
      <SVG className={nameSvgClassNames.squareBorder} />
      &nbsp;
      <SVG
        defaultName="React"
        className={nameDefaultClassNames.squareFillBorder}
      />
      &nbsp;
      <SVG className={nameSvgClassNames.squareFillBorder} />
    </section>
  </>
);
