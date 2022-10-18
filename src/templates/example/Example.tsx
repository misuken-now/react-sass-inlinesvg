import React from "react";

import { SVG } from "../../atoms/svg/Svg";

import classNames from "./example.module.scss";

export const Example = () => {
  return (
    <>
      <button className={classNames.reactButton}>
        <SVG className={classNames.svg} /> React
      </button>
      <button className={classNames.sassButton}>
        <SVG className={classNames.svg} /> Sass
      </button>
      <button className={classNames.button}>
        <SVG /> SVG
      </button>
      <button className={classNames.button}>
        <SVG /> NULL
      </button>
    </>
  );
};
