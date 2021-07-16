/**
 * Created by Victor on 2017-06-15.
 */
import * as Const from './DynamicTableTypes';

export function resetTableState() {
  return { type: Const.RESET };
}
export function addTable(parameter) {
  return { type: Const.ADD_TABLE, parameter };
}

export function updateTable(parameter) {
  return { type: Const.UPDATE_TABLE, parameter };
}

export function removeTable(parameter) {
  return { type: Const.REMOVE_TABLE, parameter };
}

export function updateTextBox(parameter) {
  return { type: Const.UPDATE_TEXTBOX, parameter };
}

export function selectedTextBox(parameter) {
  return { type: Const.SELECTED_TEXTBOX, parameter };
}

export function updateTableProperty(parameter) {
  return { type: Const.UPDATE_TABLE_PROPERTY, parameter };
}
export function previewTable(preview) {
  return { type: Const.PREVIEW_TABLE, preview };
}

export function toggleShowProperty() {
  return { type: Const.SHOW_PROPERTY };
}
export function addTableMessageHead(parameter) {
  return { type: Const.ADD_TABLE_MESSAGE_HEAD,parameter };
}
export function updateTableMessageHead(parameter) {
  return { type: Const.UPDATE_TABLE_MESSAGE_HEAD,parameter };
}
export function setMessageHeadorFoot(parameter) {
  return { type: Const.SET_MESSAGE_HEADORFOOT_TEXTAREA,parameter };
}
export function addTableMessageFoot(parameter) {
  return { type: Const.ADD_TABLE_MESSAGE_FOOT,parameter };
}

export function updateTableMessageFoot(parameter) {
  return { type: Const.UPDATE_TABLE_MESSAGE_FOOT,parameter };
}

export function updateReportGroupsExp(parameter) {
  return { type: Const.UPDATE_REPORT_GROUPS_EXP,parameter };
}
