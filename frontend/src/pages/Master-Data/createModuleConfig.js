/** Build standard master-data module config */
export function createModuleConfig({
  folder,
  model,
  title,
  subtitle,
  singularName,
  fields,
  submitButton,
  tabs = null,
  list = {},
  transformSubmit,
  loadRecord,
}) {
  return {
    model,
    title,
    subtitle,
    singularName,
    basePath: `/Master-Data/${folder}`,
    fields,
    submitButton,
    tabs,
    list,
    transformSubmit,
    loadRecord,
  };
}
