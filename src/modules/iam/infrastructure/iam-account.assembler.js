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
            identityType: account.identityType,
            identityNumber: account.identityNumber,
            dateBirth: account.dateBirth,
            email: account.email,
            phone: account.phone,
            gender: account.gender,
            isActive: account.isActive,
            address: account.address,
            role: account.role
        };
    }
}
