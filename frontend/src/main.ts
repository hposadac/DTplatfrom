import * as WEBIFC from "web-ifc";
import * as THREE from "three";
import * as BUI from "@thatopen/ui";
import Stats  from "stats.js";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as CUI from "./../tables";

//////////////////////////Setting up a simple scene

const container = document.getElementById("container")!;

const components = new OBC.Components();

const worlds = components.get(OBC.Worlds);

const world = worlds.create<
  OBC.SimpleScene,
  OBC.SimpleCamera,
  OBC.SimpleRenderer
>();

world.scene = new OBC.SimpleScene(components);
world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.SimpleCamera(components);

components.init();

world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

world.scene.setup();

const grids = components.get(OBC.Grids);
grids.create(world);

const indexer = components.get(OBC.IfcRelationsIndexer);

////////////////////////Set the background of the scene

// Create a canvas for the gradient
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;
const context = canvas.getContext('2d') as CanvasRenderingContext2D;

/// Create a gradient that goes from top-left to bottom-right
const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
gradient.addColorStop(0.84, '#000a52');  // Dark blue at 0%
gradient.addColorStop(0.99, '#000e76');  // Purple at 70%


// Apply the gradient to the canvas
context.fillStyle = gradient;
context.fillRect(0, 0, canvas.width, canvas.height);


world.scene.three.background = new THREE.CanvasTexture(canvas);



//////////////////////////Fragments manager

const fragments = components.get(OBC.FragmentsManager);
const fragmentIfcLoader = components.get(OBC.IfcLoader);

//Set the WASM technology to run C++ in the browser
await fragmentIfcLoader.setup();

//Configuration of the conversion form IFC to fragments, with the webIfc object, and moving the model to the origin of the secene
fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;



//////////////////////////Load the IFC from local path 
async function loadIfc() {
  const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const data = await file.arrayBuffer();
        const buffer = new Uint8Array(data);
        const model = await fragmentIfcLoader.load(buffer);
        //model.name = "example";
        world.scene.three.add(model);
        await indexer.process(model);
    }
}

//get the resulted model every time a new model is loaded
fragments.onFragmentsLoaded.add((model) => {
  console.log(model);
});


//Clean the scene
function disposeFragments() {
  fragments.dispose();
}



/////////////////////////Create the properties table
const [propertiesTable, updatePropertiesTable] = CUI.tables.elementProperties({
  components,
  fragmentIdMap: {},
});

propertiesTable.preserveStructureOnFilter = true;
propertiesTable.indentationInText = false;

////////////////////////Set the highlighter to click elements
const highlighter = components.get(OBF.Highlighter);
highlighter.setup({ world });

highlighter.events.select.onHighlight.add((fragmentIdMap) => {
  updatePropertiesTable({ fragmentIdMap });
});

highlighter.events.select.onClear.add(() =>
  updatePropertiesTable({ fragmentIdMap: {} }),
);



/////////////////////////Stats of the app
//Measure the performance of the app using stat.js in the top left corner of the viewpor
const stats = new Stats();
stats.showPanel(2);
document.body.append(stats.dom);
stats.dom.style.left = "0px";
stats.dom.style.zIndex = "unset";
world.renderer.onBeforeUpdate.add(() => stats.begin());
world.renderer.onAfterUpdate.add(() => stats.end());



////////////////////////Generate the UI and add functions to buttons
BUI.Manager.init();

const panel = BUI.Component.create<BUI.PanelSection>(() => {
  const onTextInput = (e: Event) => {
    const input = e.target as BUI.TextInput;
    propertiesTable.queryString = input.value !== "" ? input.value : null;
  };

  const expandTable = (e: Event) => {
    const button = e.target as BUI.Button;
    propertiesTable.expanded = !propertiesTable.expanded;
    button.label = propertiesTable.expanded ? "Collapse" : "Expand";
  };

    return BUI.html`
    <bim-panel active label="IFC Viewer" class="options-menu">
        <bim-panel-section collapsed label="Load Model">
                <input type="file" id="fileInput" lang="en">
                <bim-button label="Load IFC"
                    @click="${() => {
                        loadIfc();
                    }}">
                </bim-button>          
        </bim-panel-section>
        <bim-panel-section collapsed label="Elements Properties">
        <bim-button @click=${expandTable} label=${propertiesTable.expanded ? "Collapse" : "Expand"}></bim-button> 
        ${propertiesTable}
      </bim-panel-section>
      <bim-panel-section collapsed label="Store Model">
                <bim-button label="Store IFC"
                    @click="${() => {
                        storeIfc();
                    }}">
                </bim-button>          
        </bim-panel-section>
    </bim-panel>
    `;
});
document.body.append(panel);

///////////////////////////////Show or hide the menu in mobile phones

const button = BUI.Component.create<BUI.PanelSection>(() => {
  return BUI.html`
      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"
        @click="${() => {
          if (panel.classList.contains("options-menu-visible")) {
            panel.classList.remove("options-menu-visible");
          } else {
            panel.classList.add("options-menu-visible");
          }
        }}">
      </bim-button>
    `;
});

document.body.append(button);


async function storeIfc() {
    
    const input = document.getElementById('fileInput') as HTMLInputElement;
    const file = input.files![0];

    if (!file) {
        alert('Please select an IFC file to upload.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('http://127.0.0.1:8000/graphdb/api/query_ifc', {  // Include prefix if needed
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        const bridgeNames = result.bridge_names;
        //(document.getElementById('bridgeNames') as HTMLTextAreaElement).value = bridgeNames;
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while uploading the IFC file.');
    }
}