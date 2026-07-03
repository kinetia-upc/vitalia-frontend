import { IamAccount } from "../domain/model/iam-account.entity.js";

export class IamAccountAssembler {
    static toEntityFromResource(resource) {
        return new IamAccount(resource);
    }

    static toSessionResource(account) {
        return {
            id: account.id,
            userId: account.userId,
            subjectId: account.subjectId,
            healthcareCenterId: account.healthcareCenterId,
            name: account.name,
            paternalSurname: account.paternalSurname,
            maternalSurname: account.maternalSurname,
            email: account.email,
            role: account.role
        };
    }
}
