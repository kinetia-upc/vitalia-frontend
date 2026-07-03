import { iamLocalAccounts } from "./iam-local-accounts.js";
import { IamAccountAssembler } from "./iam-account.assembler.js";

const registeredAccountsKey = "vitalia.iam.registeredAccounts";

function normalizeEmail(value) {
    return String(value ?? "").trim().toLowerCase();
}

function readRegisteredAccounts() {
    try {
        return JSON.parse(localStorage.getItem(registeredAccountsKey) ?? "[]");
    } catch {
        return [];
    }
}

function writeRegisteredAccounts(accounts) {
    localStorage.setItem(registeredAccountsKey, JSON.stringify(accounts));
}

export class IamApi {
    getAccounts() {
        return [
            ...iamLocalAccounts,
            ...readRegisteredAccounts()
        ].map(resource => IamAccountAssembler.toEntityFromResource(resource));
    }

    findByEmail(email) {
        const normalizedEmail = normalizeEmail(email);

        return this.getAccounts().find(account => {
            const aliases = iamLocalAccounts.find(item => item.id === account.id)?.aliases ?? [];
            return normalizeEmail(account.email) === normalizedEmail ||
                aliases.some(alias => normalizeEmail(alias) === normalizedEmail);
        });
    }

    findBySubject(role, subjectId) {
        return this.getAccounts().find(account => account.role === role && account.subjectId === subjectId);
    }

    getDefaultByRole(role) {
        return this.getAccounts().find(account => account.role === role);
    }

    async signIn({ email, password }) {
        if (!email || !password) {
            throw new Error("Enter your email and password.");
        }

        const account = this.findByEmail(email);
        if (!account || !account.isActive) {
            throw new Error("We could not find an active Vitalia account for that email.");
        }

        return account;
    }

    async signUp(resource) {
        const email = normalizeEmail(resource.email);
        if (this.findByEmail(email)) {
            throw new Error("That email is already registered.");
        }

        const registeredAccounts = readRegisteredAccounts();
        const nextNumber = registeredAccounts.length + 1;
        const localId = `usr-patient-local-${String(nextNumber).padStart(3, "0")}`;
        const account = {
            id: localId,
            userId: localId,
            subjectId: `pat-local-${String(nextNumber).padStart(3, "0")}`,
            healthcareCenterId: "hc-001",
            name: resource.name,
            paternalSurname: resource.paternalSurname,
            maternalSurname: resource.maternalSurname,
            identityType: resource.identityType,
            identityNumber: resource.identityNumber,
            dateBirth: resource.dateBirth,
            email,
            phone: resource.phone,
            gender: resource.gender,
            isActive: true,
            address: resource.address,
            role: "patient"
        };

        registeredAccounts.push(account);
        writeRegisteredAccounts(registeredAccounts);

        return IamAccountAssembler.toEntityFromResource(account);
    }
}

export default new IamApi();
