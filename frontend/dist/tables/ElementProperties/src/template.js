import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as WEBIFC from "web-ifc";
import { createTasksRow } from "./tasks-row";
import { createClassificationsRow } from "./classifications-row";
import { createMaterialsRow } from "./materials-row";
import { createPsetsRow } from "./psets-row";
import { createQsetsRow } from "./qsets-row";
import { createAttributesRow } from "./attributes-row";
const addRowChildren = (row, ...children) => {
    if (!row.children)
        row.children = [];
    row.children.push(...children);
};
const processDefinedByRelations = async (components, model, expressID, row, uiState) => {
    const indexer = components.get(OBC.IfcRelationsIndexer);
    const definedByRelations = indexer.getEntityRelations(model, expressID, "IsDefinedBy");
    if (definedByRelations) {
        const psets = [];
        const qsets = [];
        for (const definition of definedByRelations) {
            const attrs = await model.getProperties(definition);
            if (!attrs)
                continue;
            if (attrs.type === WEBIFC.IFCPROPERTYSET)
                psets.push(attrs);
            if (attrs.type === WEBIFC.IFCELEMENTQUANTITY)
                qsets.push(attrs);
        }
        const psetRow = await createPsetsRow(model, psets, uiState);
        if (psetRow.children)
            addRowChildren(row, psetRow);
        const qsetRow = await createQsetsRow(model, qsets, uiState);
        if (qsetRow.children)
            addRowChildren(row, qsetRow);
    }
};
const processAssociateRelations = async (components, model, expressID, row) => {
    const indexer = components.get(OBC.IfcRelationsIndexer);
    const associateRelations = indexer.getEntityRelations(model, expressID, "HasAssociations");
    if (associateRelations) {
        const classifications = [];
        const materials = [];
        for (const associationID of associateRelations) {
            const attrs = await model.getProperties(associationID);
            if (!attrs)
                continue;
            if (attrs.type === WEBIFC.IFCCLASSIFICATIONREFERENCE) {
                classifications.push(attrs);
            }
            if (attrs.type === WEBIFC.IFCMATERIALLAYERSETUSAGE ||
                attrs.type === WEBIFC.IFCMATERIALLAYERSET ||
                attrs.type === WEBIFC.IFCMATERIALLAYER ||
                attrs.type === WEBIFC.IFCMATERIAL ||
                attrs.type === WEBIFC.IFCMATERIALLIST) {
                materials.push(attrs);
            }
        }
        const classificationsRow = await createClassificationsRow(model, classifications);
        if (classificationsRow.children)
            addRowChildren(row, classificationsRow);
        const materialsRow = await createMaterialsRow(model, materials);
        if (materialsRow.children)
            addRowChildren(row, materialsRow);
    }
};
const processAssignmentRelations = async (components, model, expressID, row) => {
    const indexer = components.get(OBC.IfcRelationsIndexer);
    const assignmentRelations = indexer.getEntityRelations(model, expressID, "HasAssignments");
    if (assignmentRelations) {
        const taskAttrs = [];
        for (const assingmentID of assignmentRelations) {
            const attrs = await model.getProperties(assingmentID);
            if (attrs && attrs.type === WEBIFC.IFCTASK)
                taskAttrs.push(attrs);
        }
        const tasksRow = await createTasksRow(components, model, taskAttrs);
        if (tasksRow.children)
            addRowChildren(row, tasksRow);
    }
};
const processContainerRelations = async (components, model, expressID, row) => {
    const indexer = components.get(OBC.IfcRelationsIndexer);
    const contianerRelations = indexer.getEntityRelations(model, expressID, "ContainedInStructure");
    if (contianerRelations && contianerRelations[0]) {
        const containerID = contianerRelations[0];
        const container = await model.getProperties(containerID);
        if (container) {
            const attributesRow = await createAttributesRow(container, {
                groupName: "SpatialContainer",
            });
            addRowChildren(row, attributesRow);
        }
    }
};
let processedElements = {};
const computeTableData = async (components, fragmentIdMap, uiState) => {
    const indexer = components.get(OBC.IfcRelationsIndexer);
    const fragments = components.get(OBC.FragmentsManager);
    const modelIdMap = fragments.getModelIdMap(fragmentIdMap);
    if (Object.keys(fragmentIdMap).length === 0)
        processedElements = {};
    const rows = [];
    for (const modelID in modelIdMap) {
        const model = fragments.groups.get(modelID);
        if (!model)
            continue;
        const modelRelations = indexer.relationMaps[model.uuid];
        if (!modelRelations)
            continue;
        if (!(modelID in processedElements))
            processedElements[modelID] = new Map();
        const modelProcessings = processedElements[modelID];
        const expressIDs = modelIdMap[modelID];
        for (const expressID of expressIDs) {
            let elementRow = modelProcessings.get(expressID);
            if (elementRow) {
                rows.push(elementRow);
                continue;
            }
            const elementAttrs = await model.getProperties(expressID);
            if (!elementAttrs)
                continue;
            elementRow = {
                data: {
                    Name: elementAttrs.Name?.value,
                },
            };
            rows.push(elementRow);
            modelProcessings.set(expressID, elementRow);
            const attributesRow = await createAttributesRow(elementAttrs, {
                includeClass: true,
            });
            if (!elementRow.children)
                elementRow.children = [];
            elementRow.children.push(attributesRow);
            const elementRelations = modelRelations.get(expressID);
            if (!elementRelations)
                continue;
            await processDefinedByRelations(components, model, expressID, elementRow, uiState);
            await processAssociateRelations(components, model, expressID, elementRow);
            await processAssignmentRelations(components, model, expressID, elementRow);
            await processContainerRelations(components, model, expressID, elementRow);
        }
    }
    return rows;
};
/**
 * Heloooooooooo
 */
export const elementPropertiesTemplate = (state) => {
    const _state = {
        emptySelectionWarning: true,
        ...state,
    };
    const { components, fragmentIdMap, emptySelectionWarning } = _state;
    const onTableCreated = async (e) => {
        if (!e)
            return;
        const table = e;
        table.columns = [{ name: "Name", width: "12rem" }];
        table.headersHidden = true;
        table.loadFunction = () => computeTableData(components, fragmentIdMap, state);
        const loaded = await table.loadData(true);
        if (loaded)
            table.dispatchEvent(new Event("datacomputed"));
    };
    const onCellCreated = ({ detail, }) => {
        const { cell } = detail;
        if (cell.column === "Name" && !("Value" in cell.rowData)) {
            cell.style.gridColumn = "1 / -1";
        }
    };
    return BUI.html `
    <bim-table @cellcreated=${onCellCreated} ${BUI.ref(onTableCreated)}>
      ${emptySelectionWarning
        ? BUI.html `
            <bim-label slot="missing-data" style="--bim-icon--c: gold" icon="ic:round-warning">
              Select some elements to display its properties
            </bim-label>
          `
        : null}
    </bim-table>
  `;
};
