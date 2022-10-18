import fs from "fs";

import React from "react";
import type { FC } from "react";
import {
  render,
  act,
  fireEvent,
  screen,
  waitFor,
  getByTitle,
  getByTestId,
} from "@testing-library/react";
import fetchMock, { enableFetchMocks } from "jest-fetch-mock";
import "@testing-library/jest-dom/extend-expect";

import { ForTest, setup as setupSvg, ExtractProps } from "../Svg";
enableFetchMocks();

jest.spyOn(global, "setTimeout");

const fooIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><polygon points=""/></svg>`;
const barIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><path d="" style="fill-rule:evenodd"/></svg>`;
const titleDescriptionIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><title>TITLE</title><desc>DESC</desc></svg>`;
const playSvg = fs.readFileSync(__dirname + "/__fixtures__/play.svg", "utf8");
const datahrefSvg = fs.readFileSync(
  __dirname + "/__fixtures__/datahref.svg",
  "utf8"
);
const pathMap = {
  FooIcon: () => "http://localhost:3000/foo-icon.svg",
  BarIcon: () => "http://localhost:3000/bar-icon.svg",
  TitleDescriptionIcon: () =>
    "http://localhost:3000/title-description-icon.svg",
  Play: () => "http://localhost:3000/play.svg",
  DataHref: () => "http://localhost:3000/datahref.svg",
};

describe("Svg", () => {
  type SVGProps = ExtractProps<typeof SVG>;
  const { SVG } = setupSvg(pathMap);
  function setup({
    props = {},
  }: { props?: SVGProps; component?: FC<SVGProps> } = {}) {
    const element = <SVG {...props} />;
    const baseResult = render(element);
    const cloneElement = (props: SVGProps) =>
      React.cloneElement(element, props);
    const rerender = (props: SVGProps) =>
      baseResult.rerender(cloneElement(props));

    const { root, result } = createResult(baseResult);
    return { root, result: { ...result, rerender } };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    ForTest["state"].setupCompleted = false;
    ForTest["state"].cacheObject = {};
    ForTest["state"].updateQueueObject = {};
    ForTest["state"].aggregation = {
      start: { queue: [] },
      fetch: { queue: [] },
      render: { queue: [] },
    };
    fetchMockIf({
      "/foo-icon.svg": fooIcon,
      "/bar-icon.svg": barIcon,
      "/title-description-icon.svg": titleDescriptionIcon,
      "/play.svg": playSvg,
      "/datahref.svg": datahrefSvg,
    });
  });
  describe("初期状態", () => {
    it("スケルトンが表示されること", () => {
      const { root } = setup();
      const element = root.query();
      expect_initial(element);
      expect(element).toMatchSnapshot();
    });
  });
  describe("ローディング中", () => {
    it("読み込み中になること", async () => {
      const { root } = setup();
      const element = root.query();
      emit(element, "FooIcon");
      expect_loading(element, "FooIcon");
      expect(element).toMatchSnapshot();
    });
  });
  describe("fetch中", () => {
    it("読み込み中になること", async () => {
      const { root } = setup();
      const element = root.query();
      await emitFetch(element, "FooIcon");
      expect_loading(element, "FooIcon");
      expect(element).toMatchSnapshot();
    });

    it("A->Bと更新するときも読み込み中になること", async () => {
      const { root } = setup({});
      const element = root.query();
      await change(element, "FooIcon");
      await emitFetch(element, "BarIcon");
      expect_loading(element, "BarIcon");
      expect(element).toMatchSnapshot();
    });
  });
  describe("読み込み完了時", () => {
    it("FooIconに更新できること", async () => {
      const { root } = setup({});
      const element = root.query();
      await change(element, "FooIcon");
      expect_complete(element, "FooIcon");
      expect(element).toMatchSnapshot();
    });

    it("A->Bと更新できること", async () => {
      const { root } = setup({});
      const element = root.query();
      await change(element, "FooIcon");
      await change(element, "BarIcon");
      expect_complete(element, "BarIcon");
      expect(element).toMatchSnapshot();
    });

    it("A->B->Aに更新できること", async () => {
      const { root } = setup({});
      const element = root.query();
      await change(element, "FooIcon");
      await change(element, "BarIcon");
      await change(element, "FooIcon");
      expect_complete(element, "FooIcon");
      expect(element).toMatchSnapshot();
    });
  });

  describe("特殊なSVGの指定", () => {
    it("svg_NULL のイベントを発生させるとSVGが切り替わること", () => {
      const { root } = setup();
      const element = root.query();
      emit(element, "NULL");
      // NULLはemitだけで反映される
      expect(element).not.toBeInTheDocument();
      expect(element).toMatchSnapshot();
    });
    it.each(["NONE", "HIDDEN"])(
      "svg_%s のイベントを発生させるとSVGが切り替わること",
      async (svgName) => {
        const { root } = setup();
        const element = root.query();
        emit(element, svgName);
        // NONE HIDDENはDOMの更新を待つ必要がある
        await waitForDomUpdate();
        expect_complete(element, svgName);
        expect(element).toMatchSnapshot();
      }
    );
  });

  describe("props", () => {
    describe("defaultName指定時", () => {
      it("NULLのときは要素を表示しないこと", () => {
        const { root } = setup({ props: { defaultName: "NULL" } });
        const element = root.query();
        // defaultNameのNULLは初回の描画から反映される
        expect(element).not.toBeInTheDocument();
        expect(element).toMatchSnapshot();
      });
      it.each(["NONE", "HIDDEN"] as const)(
        "%s のときは不可視要素を表示すること",
        (svgName) => {
          const { root } = setup({ props: { defaultName: svgName } });
          const element = root.query();
          // defaultNameのNONE HIDDENは初回の描画から反映される
          expect_complete(element, svgName);
          expect(element).toMatchSnapshot();
        }
      );
      it("animationstartを経由せずに可視要素を表示すること", async () => {
        const { root } = setup({ props: { defaultName: "FooIcon" } });
        const element = root.query();
        expect_loading(element, "FooIcon");
        await waitForAnimationStart();
        await waitForDomUpdate();
        expect_complete(element, "FooIcon");
        expect(element).toMatchSnapshot();
      });
    });

    describe("title", () => {
      it("titleを指定できること", async () => {
        const { root } = setup({ props: { title: "newTitle" } });
        const element = root.query();
        expect(screen.queryByTitle("newTitle")).not.toBeInTheDocument();
        await change(element, "FooIcon");
        expect(screen.queryByTitle("newTitle")).toBeInTheDocument();
        expect(element).toMatchSnapshot();
      });
      it("既存のtitleを上書きできること", async () => {
        const { root } = setup({ props: { title: "newTitle" } });
        const element = root.query();
        expect(screen.queryByTitle("newTitle")).not.toBeInTheDocument();
        await change(element, "TitleDescriptionIcon");
        expect(screen.queryByTitle("newTitle")).toBeInTheDocument();
        expect(element).toMatchSnapshot();
      });
      it("後からtitleを更新できること", async () => {
        const { root, result } = setup({});
        const element = root.query();
        await change(element, "FooIcon");
        expect(screen.queryByTitle("updateTitle")).not.toBeInTheDocument();
        result.rerender({ title: "updateTitle" });
        expect(screen.queryByTitle("updateTitle")).toBeInTheDocument();
        expect(element).toMatchSnapshot();
      });
      it.each(["HIDDEN", "NONE", "NULL"] as const)(
        "SVGが %s の場合はtitleが無視されること",
        async (svgName) => {
          const { root, result } = setup({ props: { title: "newTitle" } });
          const element = root.query();
          await change(element, svgName);
          expect(screen.queryByTitle("newTitle")).not.toBeInTheDocument();
          result.rerender({ title: "updateTitle" });
          expect(screen.queryByTitle("updateTitle")).not.toBeInTheDocument();
          expect(element).toMatchSnapshot();
        }
      );
    });

    describe("description", () => {
      it("descriptionを指定できること", async () => {
        const { root } = setup({ props: { description: "newDescription" } });
        const element = root.query();
        expect(screen.queryByText("newDescription")).not.toBeInTheDocument();
        await change(element, "FooIcon");
        expect(screen.queryByText("newDescription")).toBeInTheDocument();
        expect(element).toMatchSnapshot();
      });
      it("既存のdescriptionを上書きできること", async () => {
        const { root } = setup({ props: { description: "newDescription" } });
        const element = root.query();
        expect(screen.queryByText("newDescription")).not.toBeInTheDocument();
        await change(element, "TitleDescriptionIcon");
        expect(screen.queryByText("newDescription")).toBeInTheDocument();
        expect(element).toMatchSnapshot();
      });
      it("後からdescriptionを更新できること", async () => {
        const { root, result } = setup({});
        const element = root.query();
        await change(element, "FooIcon");
        expect(
          screen.queryByTitle("updateDescription")
        ).not.toBeInTheDocument();
        result.rerender({ title: "updateDescription" });
        expect(screen.queryByTitle("updateDescription")).toBeInTheDocument();
        expect(element).toMatchSnapshot();
      });
      it.each(["HIDDEN", "NONE", "NULL"] as const)(
        "SVGが %s の場合はdescription無視されること",
        async (svgName) => {
          const { root, result } = setup({
            props: { description: "newDescription" },
          });
          const element = root.query();
          await change(element, svgName);
          expect(screen.queryByTitle("newDescription")).not.toBeInTheDocument();
          result.rerender({ description: "updateTitle" });
          expect(screen.queryByTitle("updateTitle")).not.toBeInTheDocument();
          expect(element).toMatchSnapshot();
        }
      );
    });

    describe("innerRef", () => {
      it("refで要素を得られること", () => {
        const innerRef = React.createRef<SVGSVGElement>();
        setup({ props: { innerRef } });
        expect(innerRef.current).toBeInstanceOf(SVGSVGElement);
        expect(innerRef.current).toMatchSnapshot();
      });
    });

    describe("onLoad", () => {
      it("初期状態では呼び出されていないこと", () => {
        const fn = jest.fn();
        setup({ props: { onLoad: fn } });
        expect(fn).toBeCalledTimes(0);
      });
      it("SVG読み込み完了時に呼び出されること", async () => {
        const fn = jest.fn();
        const { root } = setup({ props: { onLoad: fn } });
        const element = root.query();
        emit(element, "FooIcon");
        expect(fn).toBeCalledTimes(0);
        await waitForAnimationStart();
        expect(fn).toBeCalledTimes(0);
        await waitForDomUpdate();
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toBe(pathMap.FooIcon());
        expect(fn.mock.calls[0][1]).toBe(false);
        emit(element, "BarIcon");
        expect(fn).toBeCalledTimes(1);
        await waitForAnimationStart();
        expect(fn).toBeCalledTimes(1);
        await waitForDomUpdate();
        expect(fn).toBeCalledTimes(2);
        expect(fn.mock.calls[1][0]).toBe(pathMap.BarIcon());
        expect(fn.mock.calls[1][1]).toBe(false);
        await change(element, "FooIcon");
        expect(fn).toBeCalledTimes(3);
        expect(fn.mock.calls[2][0]).toBe(pathMap.FooIcon());
        expect(fn.mock.calls[2][1]).toBe(true);
      });
    });

    describe("onError", () => {
      it("初期状態では呼び出されていないこと", () => {
        const fn = jest.fn();
        setup({ props: { onError: fn } });
        expect(fn).toBeCalledTimes(0);
      });
      it("未定義のアニメーション名でonErrorが発生すること", () => {
        const fn = jest.fn();
        const { root } = setup({ props: { onError: fn } });
        const element = root.query();
        emit(element, "ThrowError");
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toBeInstanceOf(TypeError);
        expect(fn.mock.calls[0][0].message).toBe(
          `unknown svgName "ThrowError"`
        );
        expect(element).toMatchSnapshot();
      });
    });
  });

  describe("setupSvg", () => {
    describe("uniquifyIDs", () => {
      function setup({
        defaultName,
        uniqueHash,
      }: {
        defaultName: "Play" | "DataHref";
        uniqueHash?: string;
      }) {
        const { SVG } = setupSvg(pathMap, { uniquifyIDs: true, uniqueHash });
        return createResult(
          render(
            <div>
              <SVG data-testid="svg1" defaultName={defaultName} />
              <SVG data-testid="svg2" />
            </div>
          )
        );
      }
      it("should uniquify ids with the random uniqueHash", async () => {
        const { root } = setup({ defaultName: "Play" });
        const svg1 = screen.getByTestId("svg1");
        const svg2 = screen.getByTestId("svg2");
        await waitForFetch();
        await waitForDomUpdate();
        await change(svg2, "Play");
        expect(svg1.querySelector("radialGradient")?.id).toEqual(
          expect.stringMatching(/^radialGradient-1__[\dA-Za-z]{8}$/)
        );
        expect(svg2.querySelector("radialGradient")?.id).toEqual(
          expect.stringMatching(/^radialGradient-1__[\dA-Za-z]{8}$/)
        );
      });
      it("should uniquify ids with a custom uniqueHash", async () => {
        const { root } = setup({ defaultName: "Play", uniqueHash: "test" });
        const svg1 = screen.getByTestId("svg1");
        const svg2 = screen.getByTestId("svg2");
        await waitForFetch();
        await waitForDomUpdate();
        await change(svg2, "Play");
        expect(svg1.querySelector("radialGradient")?.id).toEqual(
          expect.stringMatching(/^radialGradient-1__test$/)
        );
        expect(svg2.querySelector("radialGradient")?.id).toEqual(
          expect.stringMatching(/^radialGradient-1__test$/)
        );
        expect(root.get()).toMatchSnapshot();
      });
      it("should not uniquify non-id hrefs", async () => {
        const { root } = setup({ defaultName: "DataHref", uniqueHash: "test" });
        const svg2 = screen.getByTestId("svg2");
        await waitForFetch();
        await waitForDomUpdate();
        await change(svg2, "DataHref");
        expect(root.get()).toMatchSnapshot();
      });
    });
  });

  describe("全体処理", () => {
    function fillMap<V>(
      length: number,
      make: (index: number) => [string | number, V]
    ) {
      return Array.from({ length })
        .map((_, i) => i)
        .reduce((map, i) => {
          const [key, value] = make(i);
          map[key] = value;
          return map;
        }, {} as { [key: string]: V });
    }

    function summary(element: Element) {
      return {
        // A: aria-busy="true"
        A: element.querySelectorAll(
          "svg[aria-busy=true]:not([data-svg-status])"
        ).length,
        // B: aria-busy="true" data-svg-status="loading"
        B: element.querySelectorAll(
          "svg[aria-busy=true][data-svg-status=loading]:not([data-svg-name])"
        ).length,
        // C: aria-busy="true" data-svg-name="*" data-svg-status="loading"
        C: element.querySelectorAll(
          "svg[aria-busy=true][data-svg-status=loading][data-svg-name]"
        ).length,
        // D: data-svg-name="*" data-svg-status="complete"
        D: element.querySelectorAll(
          "svg[data-svg-status=complete][data-svg-name]"
        ).length,
      };
    }

    function svgTag(index: number) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${index} ${index}"><title>${index}</title></svg>`;
    }

    describe("10種類10個ずつ100個表示の場合", () => {
      beforeEach(() => {
        fetchMockIf(fillMap(10, (i) => [`/${i}.svg`, svgTag(i)]));
      });

      describe("defaultName指定時", () => {
        function setup() {
          const { SVG } = setupSvg(
            fillMap(10, (i) => [i, () => `http://localhost:3000/${i}.svg`])
          );
          return createResult(
            render(
              <div>
                {Array.from({ length: 100 }).map((_, i) => (
                  <SVG key={i} defaultName={String(i % 10)} />
                ))}
              </div>
            )
          );
        }

        it("初期描画後", () => {
          const element = setup().root.get();
          expect(element).toMatchSnapshot();
        });

        it("徐々に変化していくこと", async () => {
          const element = setup().root.get();

          expect(summary(element)).toStrictEqual({ A: 0, B: 0, C: 100, D: 0 });
          await waitForAnimationStart();
          expect(summary(element)).toStrictEqual({ A: 0, B: 0, C: 100, D: 0 });
          await waitForDomUpdate();
          expect(summary(element)).toStrictEqual({ A: 0, B: 0, C: 68, D: 32 });
          await waitForDomUpdate();
          expect(summary(element)).toStrictEqual({ A: 0, B: 0, C: 36, D: 64 });
          await waitForDomUpdate();
          expect(summary(element)).toStrictEqual({ A: 0, B: 0, C: 4, D: 96 });
          await waitForDomUpdate();
          expect(summary(element)).toStrictEqual({ A: 0, B: 0, C: 0, D: 100 });
          expect(element).toMatchSnapshot();
        });
      });

      describe("defaultName指定なし", () => {
        function setup() {
          const { SVG } = setupSvg(
            fillMap(10, (i) => [i, () => `http://localhost:3000/${i}.svg`])
          );
          return createResult(
            render(
              <div>
                {Array.from({ length: 100 }).map((_, i) => (
                  <SVG key={i} />
                ))}
              </div>
            )
          );
        }

        it("初期描画後", () => {
          const element = setup().root.get();
          expect(element).toMatchSnapshot();
        });

        it("徐々に変化していくこと", async () => {
          const element = setup().root.get();

          expect(summary(element)).toStrictEqual({ A: 100, B: 0, C: 0, D: 0 });
          await waitForAnimationStart();
          expect(summary(element)).toStrictEqual({ A: 84, B: 16, C: 0, D: 0 });

          fireAnimationstart(element);
          await waitForAnimationStart();
          expect(summary(element)).toStrictEqual({ A: 84, B: 0, C: 16, D: 0 });
          await waitForDomUpdate();
          expect(summary(element)).toStrictEqual({ A: 68, B: 16, C: 0, D: 16 });

          fireAnimationstart(element);
          await waitForAnimationStart();
          expect(summary(element)).toStrictEqual({ A: 68, B: 16, C: 0, D: 16 });
          await waitForDomUpdate();
          expect(summary(element)).toStrictEqual({ A: 52, B: 16, C: 0, D: 32 });
          await waitForAnimationStart();
          expect(summary(element)).toStrictEqual({ A: 52, B: 16, C: 0, D: 32 });
          await waitForDomUpdate();
          expect(summary(element)).toStrictEqual({ A: 36, B: 32, C: 0, D: 32 });

          fireAnimationstart(element);
          await waitForAnimationStart();
          expect(summary(element)).toStrictEqual({ A: 36, B: 32, C: 0, D: 32 });
          await waitForDomUpdate();
          expect(summary(element)).toStrictEqual({ A: 20, B: 16, C: 0, D: 64 });
          await waitForAnimationStart();
          expect(summary(element)).toStrictEqual({ A: 20, B: 16, C: 0, D: 64 });
          await waitForDomUpdate();
          expect(summary(element)).toStrictEqual({ A: 4, B: 32, C: 0, D: 64 });
          await waitForAnimationStart();
          expect(summary(element)).toStrictEqual({ A: 4, B: 32, C: 0, D: 64 });
          await waitForDomUpdate();
          expect(summary(element)).toStrictEqual({ A: 0, B: 36, C: 0, D: 64 });

          fireAnimationstart(element);
          await waitForAnimationStart();
          expect(summary(element)).toStrictEqual({ A: 0, B: 36, C: 0, D: 64 });
          await waitForDomUpdate();
          expect(summary(element)).toStrictEqual({ A: 0, B: 4, C: 0, D: 96 });

          fireAnimationstart(element);
          await waitForAnimationStart();
          expect(summary(element)).toStrictEqual({ A: 0, B: 4, C: 0, D: 96 });
          await waitForDomUpdate();
          expect(summary(element)).toStrictEqual({ A: 0, B: 0, C: 0, D: 100 });

          expect(element).toMatchSnapshot();
        });
      });
    });
  });
});

function createResult<
  T extends { container: { firstElementChild: Element | null } }
>(result: T) {
  return {
    result,
    root: {
      query: () => result.container.firstElementChild,
      get: () => {
        if (result.container.firstElementChild) {
          return result.container.firstElementChild;
        }
        throw new Error("element not exists");
      },
    },
  };
}

function fireAnimationstart(element: Element) {
  const svgList = Array.from(element.querySelectorAll("svg"));
  act(() => {
    element.querySelectorAll("svg[data-svg-status=loading]").forEach((svg) => {
      const pos = svgList.findIndex((s) => s === svg);
      fireEvent.animationStart(svg, { animationName: `svg_${pos % 10}` });
    });
  });
}

function emit(element: Element | null, svgName: string) {
  act(() => {
    element &&
      fireEvent.animationStart(element, { animationName: `svg_${svgName}` });
  });
}
async function emitFetch(element: Element | null, svgName: string) {
  emit(element, svgName);
  await waitForAnimationStart();
}
async function change(element: Element | null, svgName: string) {
  await emitFetch(element, svgName);
  await waitForDomUpdate();
}
async function waitForFetch() {
  await waitFor(() => {
    jest.advanceTimersByTime(0);
  });
}
async function waitForDomUpdate() {
  await waitFor(() => {
    jest.advanceTimersByTime(16);
  });
}
// NOTE: React18からwaitForFetchを3回呼ばないとanimationstartがハンドリングできない
async function waitForAnimationStart() {
  await waitForFetch();
  await waitForFetch();
  await waitForFetch();
}

function expect_initial(element: Element | null) {
  expect(element).toHaveAttribute("aria-busy", "true");
  expect(element).not.toHaveAttribute("data-svg-name");
  expect(element).not.toHaveAttribute("data-svg-status");
}

function expect_loading(element: Element | null, svgName: string) {
  expect(element).toHaveAttribute("aria-busy", "true");
  expect(element).toHaveAttribute("data-svg-name", svgName);
  expect(element).toHaveAttribute("data-svg-status", "loading");
}

function expect_complete(element: Element | null, svgName: string) {
  expect(element).not.toHaveAttribute("aria-busy");
  expect(element).toHaveAttribute("data-svg-name", svgName);
  expect(element).toHaveAttribute("data-svg-status", "complete");
}

// jestにAnimationEventが存在しないのでmockを追加
// https://gitanswer.com/fireevent-animationend-with-animationname-event-animationname-is-undefined-javascript-react-testing-library-842276564
global.AnimationEvent = class AnimationEvent
  extends Event
  implements AnimationEvent
{
  private _animationName: string;
  private _elapsedTime: number;
  private _pseudoElement: string;

  constructor(type: string, animationEventInitDict: AnimationEventInit = {}) {
    const {
      animationName = "",
      elapsedTime = 0,
      pseudoElement = "",
      ...eventInitDict
    } = animationEventInitDict;
    super(type, eventInitDict);

    this._animationName = animationName;
    this._elapsedTime = elapsedTime;
    this._pseudoElement = pseudoElement;
  }

  get animationName() {
    return this._animationName;
  }

  get elapsedTime() {
    return this._elapsedTime;
  }

  get pseudoElement() {
    return this._pseudoElement;
  }
};

function fetchMockIf(patterns: { [key: string]: string }) {
  fetchMock.mockIf(/^http:\/\/localhost:3000\/.*$/, async (req) => {
    const key = Object.keys(patterns).find((key) => req.url.endsWith(key));
    if (key) {
      return patterns[key];
    } else {
      return {
        status: 404,
        body: "Not Found",
      };
    }
  });
}
