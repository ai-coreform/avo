import {
  $getVenue,
  $setActiveMenu,
  $updateVenue,
  type SetActiveMenuInput,
  type UpdateVenueInput,
} from "./types";

class VenueApi {
  async get() {
    const res = await $getVenue();
    return await res.json();
  }

  async update(data: UpdateVenueInput) {
    const res = await $updateVenue({
      json: data,
    });
    return await res.json();
  }

  async setActiveMenu(data: SetActiveMenuInput) {
    const res = await $setActiveMenu({
      json: data,
    });
    return await res.json();
  }
}

export const venueApi = new VenueApi();
