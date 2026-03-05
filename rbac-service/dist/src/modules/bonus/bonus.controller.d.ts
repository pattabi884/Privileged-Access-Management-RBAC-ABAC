export declare class BonusController {
    approveBonus(body: {
        employeeId: string;
        amount: number;
    }): {
        message: string;
        employeeId: string;
        amount: number;
    };
}
