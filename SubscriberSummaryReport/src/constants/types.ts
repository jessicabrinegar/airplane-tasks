export type SubscriberSummaryReportType = {
    orderCode: string;
    whoPlacedOrder: string;
    orderDate: string;
    subscriberId: string;
    xmit: string;
    mrnNumber: string;
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zip: string;
    phoneNumber1: string;
    phoneNumber2: string;
    contactEmailAddress: string;
    parentOrganization: string;
    childOrganization: string;
    firstVitalDate: string;
    lastVitalDate: string;
    vitalCount: number;
    uniqueDaysVitalsTaken: number;
    trackingNumber: string;
    shippedDate: string;
    trackingStatus: string;
    trackingStatusTimestamp: string;
    shipAddressLine1: string;
    shipAddressLine2: string;
    shipCountry: string;
    shipCity: string;
    shipState: string;
    shipZip: string;
    monthlyFee: string;
    cancelDate: string;
    rapidStatus: string;
    aneltoStatus: string;
    pairedEquipment: string[];
    contractId: string;
};

export type FetchSubscriberInsightsType = {
    subscribers: any[],
    firstAndLastVitalDates: any[],
    orderDetails: OrderDetailsType[],
    subscriberXmitIds: any[]
    vitalsCount: any[],
    vitalTakenDates: any[],
    deviceLog: any[],
    subscriberProfiles: FetchSubscriberProfileType[],
    shippingInfo: FetchShippingInfoType[]
}

export type FetchShippingInfoType = {
    subscriberId: string;
    trackingInfo : {
        status : string;
        statusTimeStamp: string
    }
}

export type FetchSubscriberProfileType = {
    id: string;
    mrnNumber: string;
    addresses: SubscriberProfileAddresses[];
    phoneNumbers: SubscriberProfilePhoneNumbers[];
};

export type SubscriberProfileAddresses = {
    types: string[]
    id: string;
    address: {
        addressLine1: string;
        addressLine2: string;
        city: string;
        countryCode: string;
        postalCode: string;
        stateProvinceCode: string;
    },
    crossStreet: string;
    lockBox: string;
}

export type SubscriberProfilePhoneNumbers = {
    number: string;
    extension: string;
    id: string;
    type: string;
}

export type OrderDetailsType = {
	subscriberId: string,
	contractId: string,
	order: {
		id: string;
		code: string;
	},
	orderActivity: {
		orderDate: string;
		orderPlacedBy: string;
		activeDate: string;
		cancelDate: string;
	},
	shipmentDetails: {
		shipmentId: string;
		trackingNumber: string;
		trackingId: string;
		shipDate: string;
	},
	shippingAddress: {
		addressLine1: string;
		addressLine2: string;
		city: string;
		stateProvinceCode: string;
		postalCode: string;
		countryCode: string;
	},
	total: {
		monthlyFee: string;
	},
	pairedEquipment: string[];
};