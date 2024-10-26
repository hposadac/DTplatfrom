import * as WEBIFC from "web-ifc";
export const createMaterialsRow = async (model, materials) => {
    const row = { data: { Name: "Materials" } };
    for (const material of materials) {
        if (material.type === WEBIFC.IFCMATERIALLAYERSETUSAGE) {
            const layerSetID = material.ForLayerSet.value;
            const layerSetAttrs = await model.getProperties(layerSetID);
            if (!layerSetAttrs)
                continue;
            for (const layerHandle of layerSetAttrs.MaterialLayers) {
                const { value: layerID } = layerHandle;
                const layerAttrs = await model.getProperties(layerID);
                if (!layerAttrs)
                    continue;
                const materialAttrs = await model.getProperties(layerAttrs.Material.value);
                if (!materialAttrs)
                    continue;
                const layerRow = {
                    data: {
                        Name: "Layer",
                    },
                    children: [
                        {
                            data: {
                                Name: "Thickness",
                                Value: layerAttrs.LayerThickness.value,
                            },
                        },
                        {
                            data: {
                                Name: "Material",
                                Value: materialAttrs.Name.value,
                            },
                        },
                    ],
                };
                if (!row.children)
                    row.children = [];
                row.children.push(layerRow);
            }
        }
        if (material.type === WEBIFC.IFCMATERIALLIST) {
            for (const materialHandle of material.Materials) {
                const { value: materialID } = materialHandle;
                const materialAttrs = await model.getProperties(materialID);
                if (!materialAttrs)
                    continue;
                const materialRow = {
                    data: {
                        Name: "Name",
                        Value: materialAttrs.Name.value,
                    },
                };
                if (!row.children)
                    row.children = [];
                row.children.push(materialRow);
            }
        }
        if (material.type === WEBIFC.IFCMATERIAL) {
            const materialRow = {
                data: {
                    Name: "Name",
                    Value: material.Name.value,
                },
            };
            if (!row.children)
                row.children = [];
            row.children.push(materialRow);
        }
    }
    return row;
};
