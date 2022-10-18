/*!
 * MIT License
 *
 * Copyright (c) 2014, Matthew Dapena-Tretter / Gil Barbara
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

export const responseHandler = (response: Response) => {
  const contentType = response.headers.get("content-type");
  const [fileType] = (contentType || "").split(/ ?; ?/);

  if (response.status > 299) {
    throw new Error("Not found");
  }

  if (!["image/svg+xml", "text/plain"].some((d) => fileType.includes(d))) {
    throw new Error(`Content type isn't valid: ${fileType}`);
  }

  return response.text();
};

export function updateSVGAttributes(
  node: SVGSVGElement,
  {
    baseURL = "",
    uniquifyIDs,
    hash,
  }: { baseURL?: string; uniquifyIDs?: boolean; hash: string }
): SVGSVGElement {
  const replaceableAttributes = [
    "id",
    "href",
    "xlink:href",
    "xlink:role",
    "xlink:arcrole",
  ];
  const linkAttributes = new Set(["href", "xlink:href"]);
  const isDataValue = (name: string, value: string) =>
    linkAttributes.has(name) && (value ? !value.includes("#") : false);

  if (!uniquifyIDs) {
    return node;
  }

  [...node.children].map((d) => {
    if (d.attributes && d.attributes.length > 0) {
      //eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const attributes = Object.values(d.attributes).map((a) => {
        const attribute = a;
        const match = a.value.match(/url\((.*?)\)/);

        if (match && match[1]) {
          attribute.value = a.value.replace(
            match[0],
            `url(${baseURL}${match[1]}__${hash})`
          );
        }

        return attribute;
      });

      replaceableAttributes.forEach((r) => {
        const attribute = attributes.find((a) => a.name === r);

        //eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (attribute && !isDataValue(r, attribute.value)) {
          attribute.value = `${attribute.value}__${hash}`;
        }
      });
    }

    if (d.children.length > 0) {
      return updateSVGAttributes(d as SVGSVGElement, {
        baseURL,
        uniquifyIDs,
        hash,
      });
    }

    return d;
  });

  return node;
}

function randomCharacter(character: string) {
  return character[Math.floor(Math.random() * character.length)];
}

export function randomString(length: number): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "1234567890";
  const charset = `${letters}${letters.toUpperCase()}${numbers}`;

  let R = "";

  for (let index = 0; index < length; index++) {
    R += randomCharacter(charset);
  }

  return R;
}
