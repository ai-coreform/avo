import {
  $createMenu,
  $deleteMenu,
  $getMenu,
  $getMenuEditor,
  $getMenuPreview,
  $getMenus,
  $updateMenu,
  $updateMenuEditor,
  type CreateMenuInput,
  type UpdateMenuEditorInput,
  type UpdateMenuInput,
} from "./types";

class MenusApi {
  async create(data: CreateMenuInput) {
    const res = await $createMenu({
      json: data,
    });

    return await res.json();
  }

  async get(menuSlug: string) {
    const res = await $getMenu({
      param: { menuSlug },
    });

    return await res.json();
  }

  async getEditor(menuSlug: string) {
    const res = await $getMenuEditor({
      param: { menuSlug },
    });

    return await res.json();
  }

  async getPreview(menuSlug: string) {
    const res = await $getMenuPreview({
      param: { menuSlug },
    });

    return await res.json();
  }

  async list() {
    const res = await $getMenus();

    return await res.json();
  }

  async update(menuSlug: string, data: UpdateMenuInput) {
    const res = await $updateMenu({
      param: { menuSlug },
      json: data,
    });

    return await res.json();
  }

  async updateEditor(menuSlug: string, data: UpdateMenuEditorInput) {
    const res = await $updateMenuEditor({
      param: { menuSlug },
      json: data,
    });

    return await res.json();
  }

  async delete(menuSlug: string) {
    const res = await $deleteMenu({
      param: { menuSlug },
    });

    return await res.json();
  }
}

export const menusApi = new MenusApi();
