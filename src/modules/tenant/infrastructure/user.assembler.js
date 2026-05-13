import {User} from "../domain/model/user.entity.js";

export class UserAssembler {
    static toEntityFromResource(resource) {
        return new User({...resource});
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        const resources = response.data instanceof Array
            ? response.data
            : response.data["user"] ?? response.data["users"] ?? [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
