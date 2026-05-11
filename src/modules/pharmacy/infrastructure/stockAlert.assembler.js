import {StockAlert} from "../domain/model/stockAlert.entity.js";

export class StockAlertAssembler {
    static toEntityFromResource(resource) {
        return new StockAlert({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["stockAlert"] ?? response.data["stock-alerts"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}