/**
 * @file ext-polygon.js
 *
 *
 * @copyright 2010 CloudCanvas, Inc. All rights reserved
 *
 */

import { loadExtensionTranslation } from "../../locale.js";

const name = "polygon";

export default {
  name,
  async init(_S) {
    const svgEditor = this;
    const { svgCanvas } = svgEditor;
    const { $id } = svgCanvas;
    // const  editingitex = false;
    await loadExtensionTranslation(svgEditor, name);
    let selElems;
    let started;
    let newFO;
    /**
     * @param {boolean} on
     * @returns {void}
     */
    const showPanel = (on) => {
      $id("polygon_panel").style.display = on ? "block" : "none";
    };

    /**
     * @param {string} attr
     * @param {string|Float} val
     * @returns {void}
     */
    const setAttr = (attr, val) => {
      svgCanvas.changeSelectedAttribute(attr, val);
      svgCanvas.call("changed", selElems);
    };

    /**
     * @param {Float} n
     * @returns {Float}
     */
    const cot = (n) => 1 / Math.tan(n);

    /**
     * @param {Float} n
     * @returns {Float}
     */
    const sec = (n) => 1 / Math.cos(n);

    return {
      name: svgEditor.i18next.t(`${name}:name`),
      // The callback should be used to load the DOM with the appropriate UI items
      callback() {
        if ($id("tools_polygon") === null) {
          console.error(
            "this polygon extension must be added after the star extension"
          );
        }
        const title = svgEditor.i18next.t(`${name}:buttons.0.title`);
        const buttonTemplate = document.createElement("template");
        // eslint-disable-next-line no-unsanitized/property
        buttonTemplate.innerHTML = `
              <se-button id="tool_polygon" title="${title}" src="./images/polygon.svg">
              </se-button>
            `;
        $id("tools_polygon").append(buttonTemplate.content.cloneNode(true));

        $id("tool_polygon").addEventListener("click", () => {
          if (this.leftPanel.updateLeftPanel("tool_polygon")) {
            svgCanvas.setMode("polygon");
            showPanel(true);
          }
        });
        const label0 = svgEditor.i18next.t(`${name}:contextTools.0.label`);
        const title0 = svgEditor.i18next.t(`${name}:contextTools.0.title`);
        // Add the context panel and its handler(s)
        const panelTemplate = document.createElement("template");
        // eslint-disable-next-line no-unsanitized/property
        panelTemplate.innerHTML = `
          <div id="polygon_panel">
            <se-spin-input size="3" id="polySides" min=1 step=1 value=5 label="${label0}" title="${title0}">
            </se-spin-input>
          </div>
        `;
        $id("tools_top").appendChild(panelTemplate.content.cloneNode(true));
        $id("polygon_panel").style.display = "none";
        $id("polySides").addEventListener("change", (event) => {
          setAttr("sides", event.target.value);
        });
      },
      mouseDown(opts) {
        if (svgCanvas.getMode() !== "polygon") {
          return undefined;
        }
        // const e = opts.event;
        const rgb = svgCanvas.getColor("fill");
        // const ccRgbEl = rgb.substring(1, rgb.length);
        const sRgb = svgCanvas.getColor("stroke");
        // ccSRgbEl = sRgb.substring(1, rgb.length);
        const sWidth = svgCanvas.getStrokeWidth();

        started = true;

        newFO = svgCanvas.addSVGElementFromJson({
          element: "polygon",
          attr: {
            cx: opts.start_x,
            cy: opts.start_y,
            id: svgCanvas.getNextId(),
            shape: "regularPoly",
            sides: document.getElementById("polySides").value,
            orient: "x",
            edge: 0,
            fill: rgb,
            strokecolor: sRgb,
            strokeWidth: sWidth
          }
        });

        return {
          started: true
        };
      },
      mouseMove(opts) {
        if (!started || svgCanvas.getMode() !== "polygon") {
          return undefined;
        }
        const cx = Number(newFO.getAttribute("cx"));
        const cy = Number(newFO.getAttribute("cy"));
        const sides = Number(newFO.getAttribute("sides"));
        // const orient = newFO.getAttribute('orient');
        const fill = newFO.getAttribute("fill");
        const strokecolor = newFO.getAttribute("strokecolor");
        const strokeWidth = Number(newFO.getAttribute("strokeWidth"));

        let x = opts.mouse_x;
        let y = opts.mouse_y;

        const edg = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) / 1.5;
        newFO.setAttribute("edge", edg);

        const inradius = (edg / 2) * cot(Math.PI / sides);
        const circumradius = inradius * sec(Math.PI / sides);
        let points = "";
        for (let s = 0; sides >= s; s++) {
          const angle = (2.0 * Math.PI * s) / sides;
          x = circumradius * Math.cos(angle) + cx;
          y = circumradius * Math.sin(angle) + cy;

          points += x + "," + y + " ";
        }

        // const poly = newFO.createElementNS(NS.SVG, 'polygon');
        newFO.setAttribute("points", points);
        newFO.setAttribute("fill", fill);
        newFO.setAttribute("stroke", strokecolor);
        newFO.setAttribute("stroke-width", strokeWidth);
        return {
          started: true
        };
      },

      mouseUp() {
        if (svgCanvas.getMode() !== "polygon") {
          return undefined;
        }
        const edge = newFO.getAttribute("edge");
        const keep = edge !== "0";
        // svgCanvas.addToSelection([newFO], true);
        return {
          keep,
          element: newFO
        };
      },
      selectedChanged(opts) {
        // Use this to update the current selected elements
        selElems = opts.elems;

        let i = selElems.length;
        while (i--) {
          const elem = selElems[i];
          if (elem && elem.getAttribute("shape") === "regularPoly") {
            if (opts.selectedElement && !opts.multiselected) {
              $id("polySides").value = elem.getAttribute("sides");

              showPanel(true);
            } else {
              showPanel(false);
            }
          } else {
            showPanel(false);
          }
        }
      },
      elementChanged() {
        // const elem = opts.elems[0];
      }
    };
  }
};
