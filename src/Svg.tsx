import React, { NamedExoticComponent } from "react";
import type { ExoticComponent } from "react";
import pSettle from "p-settle";
import { FetchError } from "react-inlinesvg";
import { useEffectOnce, useIsomorphicLayoutEffect } from "react-use";

import {
  randomString,
  responseHandler,
  updateSVGAttributes,
} from "./react-inlinesvg";

export const animationNamePrefix = "svg_";

export type SpecialName = "NULL" | "NONE" | "HIDDEN";
export type PathMap = { [P in string]: () => string };
export type ErrorHandler = (error: Error | FetchError) => void;
export type LoadHandler = (src: string, hasCache: boolean) => void;
export type ExtractProps<T> = T extends ExoticComponent<infer P> ? P : never;
type PartialProps = {
  title?: string;
  description?: string;
  onError?: ErrorHandler;
  onLoad?: LoadHandler;
};
type SvgProps<N extends string> = Omit<
  React.ComponentProps<"svg">,
  "onError"
> & {
  defaultName?: N | SpecialName;
  fetchOptions?: RequestInit;
  innerRef?: React.Ref<SVGElement>;
} & PartialProps;

export type Options = {
  fetchOptions?: RequestInit;
  uniquifyIDs?: boolean;
  uniqueHash?: string;
};
type InnerOptions = {
  fetchOptions?: RequestInit;
  uniquifyIDs?: boolean;
  uniqueHash: string;
};
type Attribute = { name: string; value: string };
const State: {
  cacheObject: { [key: string]: { attributes: Attribute[]; content: string } };
  updateQueueObject: { [key: string]: SVGSVGElement[] };
  aggregation: {
    start: { queue: { element: SVGSVGElement }[] };
    fetch: {
      queue: {
        svgName: string;
        element: SVGSVGElement;
        propsRef: React.RefObject<PartialProps>;
      }[];
    };
    render: { queue: { render: () => void }[] };
  };
  setupCompleted: boolean;
} = {
  cacheObject: {},
  updateQueueObject: {},
  aggregation: {
    start: { queue: [] },
    fetch: { queue: [] },
    render: { queue: [] },
  },
  setupCompleted: false,
};

export class ForTest {
  protected static state = State;
}

export function setup<T extends PathMap>(
  pathMap: T,
  options: Options = {}
): {
  SVG: NamedExoticComponent<SvgProps<keyof T & string>>;
  pathMap: T;
} {
  return {
    SVG: React.memo(createSvg(pathMap, options)),
    pathMap,
  };
}

export function renderStoryCatalog<N extends string>(
  SVG: React.VFC<SvgProps<N>>,
  pathMap: PathMap,
  className: string,
  useDefault = false
) {
  return (
    <div className={className}>
      {Object.keys(pathMap).map((svgName) => (
        <section key={svgName} data-svg-name={svgName}>
          <h1>{svgName}</h1>
          <SVG defaultName={useDefault ? (svgName as N) : undefined} />
        </section>
      ))}
    </div>
  );
}

function createSvg<T extends PathMap>(
  pathMap: T,
  { fetchOptions, uniquifyIDs, uniqueHash }: Options = {}
): React.VFC<SvgProps<keyof T & string>> {
  const options = {
    fetchOptions,
    uniquifyIDs,
    uniqueHash: uniqueHash || randomString(8),
  };
  const Component: React.VFC<SvgProps<keyof T & string>> = ({
    onLoad,
    onError,
    innerRef,
    defaultName,
    title,
    description,
    ...props
  }) => {
    const elementRef = React.useRef<SVGSVGElement | null>(null);
    const propsRef = React.useRef<PartialProps | null>(null);
    const [defaultNameEnabled] = React.useState(() => Boolean(defaultName));
    const svgName = useSvgName(
      pathMap,
      defaultName,
      elementRef,
      propsRef,
      options
    );

    useIsomorphicLayoutEffect(() => {
      const initializing = !propsRef.current;
      propsRef.current = { title, description, onError, onLoad };
      // 初回描画時は処理が不要であり、軽量化するためにスキップ
      if (!initializing && elementRef.current) {
        updateTextNode(elementRef.current, { title, description });
      }
    }, [onLoad, onError, title, description]);

    useIsomorphicLayoutEffect(() => {
      const element = elementRef.current;
      if (!element || !defaultName || svgNameIsEmptyType(defaultName)) {
        return;
      }
      updateElement(element, defaultName, pathMap, propsRef, options);
    }, []);

    useEffectOnce(() => {
      // 一番最初にここへ到達した処理のみが実施する初期処理
      if (!State.setupCompleted) {
        setupStyle(Object.keys(pathMap));
        State.setupCompleted = true;
      }
      if (defaultNameEnabled) {
        return;
      }
      // 初回のsvg反映処理の開始
      if (elementRef.current) {
        aggregateProcess(
          State.aggregation.start,
          { element: elementRef.current },
          (list) => {
            list.map(({ element }) => {
              element.dataset.svgStatus = "loading";
            });
          }
        );
      }
    });

    if (svgName === "NULL") {
      return null;
    }

    // スケルトンを描画
    return (
      <svg
        {...resolveBaseProps(svgName)}
        {...props}
        ref={(ref) => {
          elementRef.current = ref;
          if (innerRef instanceof Function) {
            innerRef(ref);
          } else if (innerRef) {
            //eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // 外部からrefが渡されている場合にreadonlyを無視して書き換える必要がある
            Object.assign(innerRef, { current: ref });
          }
        }}
      />
    );
  };
  Component.displayName = "Svg";
  return Component;
}

function resolveBaseProps(svgName: string | undefined) {
  if (svgNameIsEmptyType(svgName)) {
    return {
      "data-svg-name": svgName,
      "data-svg-status": "complete",
    };
  }
  return {
    "aria-busy": true,
  };
}

function useSvgName<T extends PathMap>(
  pathMap: T,
  defaultName: (keyof T & string) | undefined,
  elementRef: React.RefObject<SVGSVGElement | null>,
  propsRef: React.RefObject<PartialProps>,
  options: InnerOptions
) {
  const [svgName, setSvgName] = React.useState<string | undefined>(defaultName);

  useEffectOnce(() => {
    const element = elementRef.current;
    if (element) {
      const handler = (event: AnimationEvent): void => {
        // svg_SvgName を含む形式のアニメーション名をsvg名として検出
        const svgName = resolveSvgName(event);
        // 特定のアニメーション名の形式に該当しない場合はその他のアニメーションなので無視する
        if (!svgName) {
          return;
        }
        event.stopPropagation();
        if (svgName === "NULL") {
          setSvgName(svgName);
        } else {
          updateElement(element, svgName, pathMap, propsRef, options);
        }
      };
      element.addEventListener("animationstart", handler, true);
      return () => {
        element.removeEventListener("animationstart", handler, true);
      };
    }
  });

  return svgName;
}

function updateElement(
  element: SVGSVGElement,
  svgName: string,
  pathMap: PathMap,
  propsRef: React.RefObject<PartialProps>,
  options: InnerOptions
) {
  if (svgNameIsEmptyType(svgName)) {
    updateElementForEmpty(element, svgName);
    return;
  }
  if (svgName in State.cacheObject) {
    updateElementByCache(
      element,
      svgName,
      propsRef,
      options,
      pathMap[svgName]()
    );
    return;
  }
  updateElementByFetch(element, svgName, pathMap, propsRef, options);
}

function updateElementByFetch(
  element: SVGSVGElement,
  svgName: string,
  pathMap: PathMap,
  propsRef: React.RefObject<PartialProps>,
  options: InnerOptions
) {
  const onError = propsRef.current?.onError || null;
  if (!(svgName in pathMap)) {
    onError?.(new TypeError(`unknown svgName "${svgName}"`));
    updateElementForError(element, svgName);
    return;
  }

  updateElementForLoading(element, svgName);
  if (svgName in State.updateQueueObject) {
    State.updateQueueObject[svgName].push(element);
    return;
  }
  State.updateQueueObject[svgName] = [element];

  // 取得処理は一定数まとめたほうが処理時間を短縮できる様子
  aggregateProcess(
    State.aggregation.fetch,
    { svgName, element, propsRef },
    (list) => {
      pSettle(
        list.map(({ svgName }) => createFetch(pathMap[svgName](), options))
      )
        .then((results) => {
          results.map((result, index) => {
            if (result.isRejected) {
              const propsRef = list[index].propsRef;
              const onError = propsRef.current?.onError;
              // TODO: State.updateQueueObject に溜まっているものにも反映する
              if (result.reason instanceof Error) {
                onError?.(result.reason);
              } else {
                onError?.(new TypeError("pSettle rejected"));
              }
              return;
            }
            const svgName = list[index].svgName;
            const src = pathMap[svgName]();
            State.cacheObject[svgName] = parse(result.value);
            State.updateQueueObject[svgName].forEach((element, index) => {
              const hasCache = index !== 0;
              updateElementByCache(
                element,
                svgName,
                propsRef,
                options,
                src,
                hasCache
              );
            });
            State.updateQueueObject[svgName] = [];
          });
        })
        .catch((error) => {
          if (error instanceof Error) {
            onError?.(error);
          }
        });
    }
  );
}

function createFetch(url: string, options: Options) {
  return fetch(url, options.fetchOptions).then(responseHandler);
}

function updateElementForEmpty(element: SVGSVGElement, svgName: string) {
  const render = () => {
    resetAttributes(element);
    element.dataset.svgName = svgName;
    element.dataset.svgStatus = "complete";
    element.removeAttribute("aria-busy");
    element.innerHTML = "";
  };

  aggregateProcess(
    State.aggregation.render,
    { render },
    (list) => {
      requestAnimationFrame(() => {
        list.forEach(({ render }) => render());
      });
    },
    16,
    32
  );
}

function resetAttributes(element: SVGSVGElement) {
  // 前回のsvgの属性を削除
  if (element.dataset.attributeNames) {
    element.dataset.attributeNames.split(" ").forEach((name) => {
      element.removeAttribute(name);
    });
    element.removeAttribute("data-attribute-names");
  }
}

function updateElementForLoading(element: SVGSVGElement, svgName: string) {
  resetAttributes(element);
  element.dataset.svgName = svgName;
  element.dataset.svgStatus = "loading";
  element.setAttribute("aria-busy", "true");
  element.innerHTML = "";
}

function updateElementForError(element: SVGSVGElement, svgName: string) {
  element.dataset.svgName = svgName;
  element.dataset.svgStatus = "error";
  element.removeAttribute("aria-busy");
}

function updateElementByCache(
  element: SVGSVGElement,
  svgName: string,
  propsRef: React.RefObject<PartialProps>,
  options: InnerOptions,
  src: string,
  hasCache = true
) {
  const render = () => {
    const { attributes, content } = State.cacheObject[svgName];
    const attributeNames: string[] = [];
    resetAttributes(element);
    attributes.forEach(({ name, value }) => {
      element.setAttribute(name, value);
      attributeNames.push(name);
    });
    element.dataset.svgName = svgName;
    element.dataset.svgStatus = "complete";
    element.dataset.attributeNames = attributeNames.join(" "); // 今回のsvgの属性を登録
    element.removeAttribute("aria-busy");
    element.innerHTML = content;
    propsRef.current && updateTextNode(element, propsRef.current);
    updateSVGAttributes(element, {
      baseURL: "", // props経由で受け取ると更新が難しそうなので保留
      uniquifyIDs: options.uniquifyIDs,
      hash: options.uniqueHash,
    });
    propsRef.current?.onLoad?.(src, hasCache);
  };
  aggregateProcess(
    State.aggregation.render,
    { render },
    (list) => {
      requestAnimationFrame(() => {
        list.forEach(({ render }) => render());
      });
    },
    16,
    32
  );
}

export function updateTextNode(
  svg: SVGSVGElement,
  { title, description }: { title?: string; description?: string }
) {
  const svgName = svg.dataset.svgName;
  if (svgNameIsEmptyType(svgName)) {
    return;
  }

  if (description) {
    svg.querySelector("desc")?.remove();

    const descElement = document.createElement("desc");
    descElement.textContent = description;
    svg.prepend(descElement);
  }

  if (title) {
    svg.querySelector("title")?.remove();

    const titleElement = document.createElement("title");
    titleElement.textContent = title;
    svg.prepend(titleElement);
  }
}

function aggregateProcess<T>(
  state: { queue: T[] },
  data: T,
  run: (list: T[]) => void,
  delayMs = 16,
  unitSize = 16
) {
  // 処理が集中したとき、全てをキューに追加し、1つ目のプロセスのみが非同期で一括でキューの処理を捌いていく。
  // 指定されたdelayMsとunitSizeでキューの中身を処理するため、キューが空になる前に追加された分も順番に処理されていく。
  // キューの処理を全て実行し終えたらキューを空にして再び元の状態に戻る。
  state.queue.push(data);
  if (state.queue.length === 1) {
    // 次の処理の予約
    function reserve(timerMs: number, pos = 0) {
      setTimeout(() => {
        const nextPos = pos + unitSize;
        run(state.queue.slice(pos, nextPos));
        if (state.queue.length <= nextPos) {
          state.queue = [];
        } else {
          reserve(delayMs, nextPos);
        }
      }, timerMs);
    }
    reserve(0);
  }
}

function parse(text: string) {
  const svgStartMaker = "<svg ";
  // A<svg attr1="value1" attr2="value2">B</svg>C -> <svg attr="value">B
  const svgHtml = text.slice(
    text.indexOf(svgStartMaker),
    text.lastIndexOf("</svg>")
  );
  const gtPos = svgHtml.indexOf(">");
  // <svg attr="value">B -> attr1="value1" attr2="value2"
  const attributesText = svgHtml.slice(svgStartMaker.length, gtPos);
  // <svg attr="value">B -> B
  const content = svgHtml.slice(gtPos + 1);
  const attributes: Attribute[] = [];
  attributesText.replace(
    /([\d:a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
    (_: string, name: string, value: string, value2: string) => {
      attributes.push({ name, value: value ?? value2 });
      return "";
    }
  );
  return { content, attributes };
}

function setupStyle(svgNames: string[]) {
  const id = "svg-style-keyframes";
  document.querySelector(`#${id}`)?.remove(); // Storybookなどだと重複して追加されるのでそれを防ぐ

  // ヘッダにSVG切り替えイベント用のアニメーションを設置する
  const style = document.createElement("style");
  style.id = id;
  // "NULL" "NONE" "HIDDEN"は非表示用の特別なキー
  style.textContent = ["NULL", "NONE", "HIDDEN", ...svgNames]
    .map((name) => `@keyframes svg_${name} {}`)
    .join("\n");

  // NOTE: SafariはCSS側でanimation-nameプロパティが当たる前に@keyframesが用意されていないとanimationstartが発火しない。
  // そのため、まず@keyframesを設置してから、確実に次の描画以降でanimation-nameプロパティが当たるようにタイミングを調整する必要があります。
  document.head.append(style);
}

function resolveSvgName(event: AnimationEvent) {
  return (
    event.animationName.startsWith(animationNamePrefix) &&
    event.animationName.slice(animationNamePrefix.length)
  );
}

function svgNameIsEmptyType(svgName: string | undefined) {
  return svgName === "NONE" || svgName === "HIDDEN";
}
