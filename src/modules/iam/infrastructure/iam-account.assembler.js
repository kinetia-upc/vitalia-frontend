import { IamAccount } from "../domain/model/iam-account.entity.js";

export class IamAccountAssembler {
    static toEntityFromResource(resource) {
        return new IamAccount(resource);
    }

    static toSessionResource(account) {
        return {
            userId: account.userId,
            doctorId: account.doctorId,
            patientId: account.patientId,
            token: account.token,
            expiresAt: account.expiresAt,
            healthcareCenterId: account.healthcareCenterId,
            name: account.name,
            paternalSurname: account.paternalSurname,
            maternalSurname: account.maternalSurname,
            email: account.email,
            role: account.role
        };
    }
}
