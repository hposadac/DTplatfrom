export const createClassificationsRow = async (model, classifications) => {
    const row = { data: { Name: "Classifications" } };
    for (const classification of classifications) {
        const { value: sourceID } = classification.ReferencedSource;
        const sourceAttrs = await model.getProperties(sourceID);
        if (!sourceAttrs)
            continue;
        const classificationRow = {
            data: {
                Name: sourceAttrs.Name.value,
            },
            children: [
                {
                    data: {
                        Name: "Identification",
                        Value: classification.Identification?.value ||
                            classification.ItemReference?.value,
                    },
                },
                {
                    data: {
                        Name: "Name",
                        Value: classification.Name.value,
                    },
                },
            ],
        };
        if (!row.children)
            row.children = [];
        row.children.push(classificationRow);
    }
    return row;
};
