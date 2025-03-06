import {
  CLIENT_WIDTH,
  dragElement,
  IS_MOBILE,
  utcToLocal,
  toggleVisibility,
} from "../../util.js";
//import { getCatalogEntries } from "../../services.js";
import { getCatalogs, getCatalogEntries } from "../../clientServices.js";
import { controllers } from "../Controller.js";

import { CatalogItem } from "./catalogItem.js";
import { CatalogOption } from "./CatalogOption.js";

/** Component for menu. Includes three different columns for data related to fires, fuel moisture, and satellite data.
 * Can be moved around by clicking the title bar, can be closed by clicking x in top right corner, and
 * supports searching columns for data that matches a description.
 *
 *                  Contents
 *  1. Initialization block
 *  2. Searching block
 *
 */
export class CatalogMenu extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.firesList = [];
    this.fuelMoistureList = [];
    this.satelliteList = [];
    this.addOrder = [];
    this.catalogs = [];
    this.catalogId = null;
    this.innerHTML = `
            <div>
                <div id='catalog-button' class='feature-controller catalog-button'>
                    <div id='catalog-menu-icon-container'>
                        <svg id='catalog-menu-icon' class='interactive-button svgIcon'>
                            <use href='#menu-24px'></use>
                        </svg>
                    </div>
                    <div id='menu-label'>Catalog</div>
                    <ul id='catalog-options' class="hidden">
                    </ul>
                </div>
                <div class='catalog-menu round-border'>
                    <div id='menu-title' class='menu-title round-border'>
                        <div>Select Simulation...</div>
                        <div id='menu-close' class='round-border'>x</div>
                    </div>
                    <div class='search-header'>
                        <div>
                            <label for='sort-by' style='display: block; font-size:.75rem'>order by</label>
                            <select id='sort-by'>
                                <option value='start-date'>start date</option>
                                <option value='end-date'>end date</option>
                                <option value='original-order'>original order</option>
                                <option value='description'>description</option>
                            </select>
                        </div>
                        <div class='sorting-column'>
                            <label id='reverse-label' for='reverse-order'>Reverse Order</label>
                            <input type='checkbox' id='reverse-order'></input>
                        </div>
                        <input id='search-for' type='text'></input>
                    </div>
                    <div class='menu-columns'>
                        <select id='mobile-selector'>
                            <option value='Fires'>Fires</option>
                            <option value='Fuel Moisture'>Fuel Moisture</option>
                            <option value='Lidar Data'>Lidar Data</option>
                            <option value='NFMDB Links'>NFMDB Links</option>
                        </select>
                        <div id='fires-column' class='column'>
                            <div class='column-header'>Fires</div>
                            <ul id='catalog-fires' class='catalog-list'> </ul>
                        </div>
                        <div id='fuel-moisture-column' class='column'>
                            <div class='column-header'>Fuel moisture</div>
                            <ul id='catalog-fuel-moisture' class='catalog-list'> </ul>
                        </div>
                        <div id='lidar-profiles' class='column'>
                            <div class='column-header'>Lidar Profiles</div>
                            <ul id='catalog-lidar-data' class='catalog-list'> </ul>
                        </div>
                        <div id='nfmdb-links' class='column'>
                            <div class='column-header'>NFMDB Links</div>
                            <ul id='catalog-nfmdb-links' class='catalog-list'> 
                              <li class='catalog-entry'>
                                <div id='entry'>
                                  <a href='https://nfmdb.org'>
                                    <h3>FMDB Home Page</h3>
                                  </a>
                                </div>
                              </li>
                              <li class='catalog-entry'>
                                <div id='entry'>
                                  <a href='https://nfmdb.com/?usState=CA&zoom=6&coordinates=37.821_-120.724&startYear=2022&endYear=2024&liveOrDeadFuel=liveFuel&plotType=fmcClimo'>
                                    <h3>FMDB California</h3>
                                  </a>
                                </div>
                              </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  connectedCallback() {
    const catalogMenu = this.querySelector(".catalog-menu");
    L.DomEvent.disableClickPropagation(catalogMenu);

    dragElement(catalogMenu, "menu-title");
    this.hideShowMenu();
    this.responsiveUI();
    window.addEventListener("resize", () => {
      this.responsiveUI();
    });
    this.initializeMenuSearching();
    this.createCatalogs();
  }

  async createCatalogs() {
    const catalogOptions = this.querySelector("#catalog-options");
    this.catalogs = await getCatalogs();
    if (this.catalogs.length > 0) {
      const catalogId = this.catalogs[0].id;
      this.createMenuEntries(catalogId);
      for (let catalog of this.catalogs) {
        let catalogOption = new CatalogOption(catalog);
        catalogOption.onclick = () => this.createMenuEntries(catalog.id);
        catalogOptions.appendChild(catalogOption);
      }
    }
  }

  hideShowMenu() {
    const catalogMenu = this.querySelector(".catalog-menu");
    const catalogButtons = this.querySelector("#catalog-button");
    const catalogButton = this.querySelector("#menu-label");
    const catalogMenuIcon = this.querySelector("#catalog-menu-icon-container");
    const catalogOptions = this.querySelector("#catalog-options");
    L.DomEvent.disableClickPropagation(catalogButtons);
    catalogButton.onpointerdown = () => {
      toggleVisibility(catalogMenu);
    };
    catalogMenuIcon.onpointerdown = () => {
      toggleVisibility(catalogOptions);
    };

    this.querySelector("#menu-close").onclick = () => {
      catalogMenu.classList.add("hidden");
    };
  }

  responsiveUI() {
    const catalogMenu = this.querySelector(".catalog-menu");
    const reverseLabel = this.querySelector("#reverse-label");
    const menuSearch = this.querySelector("#search-for");

    reverseLabel.innerText = IS_MOBILE ? "Reverse" : "Reverse Order";
    catalogMenu.style.right =
      (CLIENT_WIDTH - catalogMenu.clientWidth) / 2 + "px";
    let searchDescription = IS_MOBILE
      ? "Search..."
      : "Search for Simulation...";
    menuSearch.placeholder = searchDescription;
    if (IS_MOBILE) {
      this.selectCategory("Fires");
    } else {
      const firesListDOM = this.querySelector("#fires-column");
      const fuelMoistureListDOM = this.querySelector("#fuel-moisture-column");
      const lidarProfilesDOM = this.querySelector("#lidar-profiles");
      firesListDOM.classList.remove("hidden");
      fuelMoistureListDOM.classList.remove("hidden");
      lidarProfilesDOM.classList.remove("hidden");
    }
  }

  initializeMenuSearching() {
    const sortBy = this.querySelector("#sort-by");
    const reverseOrder = this.querySelector("#reverse-order");
    const menuSearch = this.querySelector("#search-for");
    const menuSelect = this.querySelector("#mobile-selector");

    menuSearch.onpointerdown = (e) => {
      e.stopPropagation();
    };
    menuSearch.oninput = () => {
      this.searchCatalog(
        menuSearch.value.toLowerCase(),
        sortBy.value,
        reverseOrder.checked,
      );
    };
    sortBy.onchange = () => {
      this.sortMenu(sortBy.value, reverseOrder.checked);
    };
    reverseOrder.onclick = () => {
      this.searchCatalog(
        menuSearch.value.toLowerCase(),
        sortBy.value,
        reverseOrder.checked,
      );
    };
    menuSelect.onchange = () => {
      this.selectCategory(menuSelect.value);
    };
  }

  async createMenuEntries(catalogId) {
    if (this.catalogId == catalogId) {
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const navJobId = urlParams.get("job_id");
    const firesListDOM = this.querySelector("#catalog-fires");
    const fuelMoistureListDOM = this.querySelector("#catalog-fuel-moisture");
    const lidarProfilesDOM = this.querySelector("#catalog-lidar-data");
    const catalogEntries = await getCatalogEntries(catalogId);
    this.catalogId = catalogId;
    controllers.catalogId.setValue(catalogId);
    this.addOrder = [];
    this.fuelMoistureList = [];
    this.satelliteList = [];
    this.firesList = [];
    firesListDOM.innerHTML = "";
    fuelMoistureListDOM.innerHTML = "";
    lidarProfilesDOM.innerHTML = "";
    for (let catEntry of catalogEntries) {
      let catName = catEntry.name;
      this.addOrder.push(catEntry.job_id);
      let desc = catEntry.description;
      let newLI = new CatalogItem(catEntry, navJobId, this.catalogId);
      if (desc.indexOf("GACC") >= 0 || desc.indexOf(" FM") >= 0) {
        this.fuelMoistureList.push(catEntry);
        fuelMoistureListDOM.appendChild(newLI);
      } else if (desc.indexOf("Lidar") >= 0) {
        this.satelliteList.push(catEntry);
        lidarProfilesDOM.appendChild(newLI);
      } else {
        this.firesList.push(catEntry);
        firesListDOM.appendChild(newLI);
      }
    }
    this.sortMenu("start-date", false);
    this.clickMostRecent(navJobId);
  }

  clearMenu() {
    const firesListDOM = this.querySelector("#catalog-fires");
    const fuelMoistureListDOM = this.querySelector("#catalog-fuel-moisture");
    const lidarProfilesDOM = this.querySelector("#catalog-lidar-data");
    firesListDOM.innerHTML = "";
    fuelMoistureListDOM.innerHTML = "";
    lidarProfilesDOM.innerHTML = "";
  }

  clickMostRecent(navJobId) {
    const firesListDOM = this.querySelector("#catalog-fires");
    if (!navJobId || !navJobId.includes("recent")) {
      return;
    }
    let descSearchTerm = navJobId.split("-")[0].toLowerCase();
    let mostRecentItem = null;
    let secondMostRecentItem = null;
    for (let fire of firesListDOM.childNodes) {
      let fireDesc = fire.catEntry.description;
      if (fireDesc.toLowerCase().includes(descSearchTerm)) {
        if (
          !mostRecentItem ||
          fire.catEntry.from_utc > mostRecentItem.catEntry.from_utc
        ) {
          secondMostRecentItem = mostRecentItem;
          mostRecentItem = fire;
        } else if (
          !secondMostRecentItem ||
          fire.catEntry.from_utc > secondMostRecentItem.catEntry.from_utc
        ) {
          secondMostRecentItem = fire;
        }
      }
    }
    let itemToNavigateTo = mostRecentItem;
    if (navJobId.includes("second-recent")) {
      itemToNavigateTo = secondMostRecentItem;
    }

    if (itemToNavigateTo != null) {
      itemToNavigateTo.clickItem();
    }
  }

  /** ===== Searching block ===== */
  searchCatalog(searchText, sortBy, reverseOrder) {
    const filterFunction = (catalogEntry) => {
      let descIncludes = catalogEntry.description
        .toLowerCase()
        .includes(searchText);
      let startIncludes = utcToLocal(catalogEntry.from_utc)
        .toLowerCase()
        .includes(searchText);
      let endIncludes = utcToLocal(catalogEntry.to_utc)
        .toLowerCase()
        .includes(searchText);
      return descIncludes || startIncludes || endIncludes;
    };
    const createList = (list) => {
      let filteredList = list.filter(filterFunction);
      if (reverseOrder) {
        filteredList.reverse();
      }
      return filteredList;
    };
    this.filterColumns(createList);
  }

  sortMenu(sortBy, reverseOrder) {
    const catalogSearch = this.querySelector("#search-for");
    catalogSearch.value = "";
    const sortingFunction = (listElem1, listElem2) => {
      let result;
      switch (sortBy) {
        case "original-order":
          result = this.sortByOriginalOrder(listElem1, listElem2);
          break;
        case "description":
          result = this.sortByDescription(listElem1, listElem2);
          break;
        case "start-date":
          result = this.sortByStartDate(listElem1, listElem2);
          break;
        case "end-date":
          result = this.sortByEndDate(listElem1, listElem2);
          break;
        default:
          result = false;
      }
      if (reverseOrder) {
        result = !result;
      }
      return result ? 1 : -1;
    };
    const createList = (list) => {
      return list.sort(sortingFunction);
    };
    this.filterColumns(createList);
  }

  sortByOriginalOrder(listElem1, listElem2) {
    let desc = listElem1.description;
    if (desc.indexOf("GACC") >= 0 || desc.indexOf(" FM") >= 0) {
      return (
        listElem1.description.toLowerCase() >
        listElem2.description.toLowerCase()
      );
    } else {
      return (
        this.addOrder.indexOf(listElem1.job_id) >
        this.addOrder.indexOf(listElem2.job_id)
      );
    }
  }

  sortByDescription(listElem1, listElem2) {
    return (
      listElem1.description.toLowerCase() > listElem2.description.toLowerCase()
    );
  }

  sortByStartDate(listElem1, listElem2) {
    if (listElem1.from_utc == listElem2.from_utc) {
      return (
        listElem1.description.toLowerCase() >
        listElem2.description.toLowerCase()
      );
    } else {
      return listElem1.from_utc < listElem2.from_utc;
    }
  }

  sortByEndDate(listElem1, listElem2) {
    if (listElem1.to_utc == listElem2.to_utc) {
      return (
        listElem1.description.toLowerCase() >
        listElem2.description.toLowerCase()
      );
    } else {
      return listElem1.to_utc < listElem2.to_utc;
    }
  }

  filterColumns(listCreator) {
    const firesListDOM = this.querySelector("#catalog-fires");
    const fuelMoistureListDOM = this.querySelector("#catalog-fuel-moisture");
    const lidarProfilesDOM = this.querySelector("#catalog-lidar-data");

    this.filterColumn(firesListDOM, this.firesList, listCreator);
    this.filterColumn(fuelMoistureListDOM, this.fuelMoistureList, listCreator);
    this.filterColumn(lidarProfilesDOM, this.satelliteList, listCreator);
  }

  filterColumn(categoryDOM, categoryList, listCreator) {
    categoryDOM.innerHTML = "";
    let newList = listCreator(categoryList);
    for (let catalogEntry of newList) {
      let newLI = new CatalogItem(catalogEntry, null, this.catalogId);
      categoryDOM.append(newLI);
    }
  }

  /** Function used only in mobile versions. Mobile shows only one column at a time and this function is called when a user switches between columns.
   * Hides all columns and then shows the selected column. */
  selectCategory(selection) {
    const firesListDOM = this.querySelector("#fires-column");
    const fuelMoistureListDOM = this.querySelector("#fuel-moisture-column");
    const lidarProfilesDOM = this.querySelector("#lidar-profiles");
    const nfmdbLinksDOM = this.querySelector("#nfmdb-links");
    firesListDOM.classList.add("hidden");
    fuelMoistureListDOM.classList.add("hidden");
    lidarProfilesDOM.classList.add("hidden");
    nfmdbLinksDOM.classList.add("hidden");
    if (selection == "Fires") {
      firesListDOM.classList.remove("hidden");
    } else if (selection == "Fuel Moisture") {
      fuelMoistureListDOM.classList.remove("hidden");
    } else if (selection == "Lidar Data") {
      lidarProfilesDOM.classList.remove("hidden");
    } else {
      nfmdbLinksDOM.classList.remove("hidden");
    }
  }
}

window.customElements.define("catalog-menu", CatalogMenu);
