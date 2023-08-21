import { FetchShippingInfoType } from "../constants/types";
import { FetchSubscriberProfileType, SubscriberProfileAddresses } from "../constants/types";
import { OrderDetailsType } from "../constants/types";
import { SubscriberSummaryReportType } from "../constants/types";

// https://orgs.ecg-api.com/api/seed-data/timezones


export class SubscriberSummaryReportMapper {
    public static toJson(data: SubscriberSummaryReportType) {
        return ({
            "Order Code": data.orderCode ?? "-",
            "Who Placed Order": data?.whoPlacedOrder ?? "-", // alternatively without fetch_order_details fix: data?.whoPlacedOrder && data?.whoPlacedOrder !== "undefined undefined" ? data?.whoPlacedOrder : "-",
            "Order Date": data.orderDate ?? "-",
            "Subscriber Id": data?.subscriberId ?? "-",
            "Xmit": data?.xmit ?? "-",
            "Patient Id": data?.mrnNumber ?? "-",
            "First Name": data?.firstName ?? "-",
            "Last Name": data?.lastName ?? "-",
            "Address Line 1": data?.addressLine1 ?? "-",
            "Address Line 2": data?.addressLine2 ?? "-",
            "City": data?.city ?? "-",
            "State": data?.state ?? "-",
            "Zip": data?.zip ?? "-",
            "Phone Number 1": data?.phoneNumber1 ?? "-",
            "Phone Number 2": data?.phoneNumber2 ?? "-",
            "Email": data?.contactEmailAddress ?? "-",
            "Organization Parent": data?.parentOrganization ?? "-",
            "Organization Child": data?.childOrganization ?? "-",
            "First Vital Date": data?.firstVitalDate ?? "-",
            "Last Vital Date": data?.lastVitalDate ?? "-",
            "Vital Count": data?.vitalCount ?? 0,
            "Unique Days Vitals Taken": data?.uniqueDaysVitalsTaken ?? "-",
            "Tracking Number": data?.trackingNumber ?? "-",
            "Shipped Date": data?.shippedDate ?? "-",
            "Tracking Status": data?.trackingStatus ?? "-",
            "Tracking Status Timestamp": data?.trackingStatusTimestamp ?? "-",
            "Ship to Address Line 1": data?.shipAddressLine1 ?? "-",
            "Ship to Address Line 2": data?.shipAddressLine2 ?? "-",
            "Ship City": data?.shipCity ?? "-",
            "Ship State": data?.shipState ?? "-",
            "Ship Zip": data?.shipZip ?? "-",
            "Monthly Fee": data?.monthlyFee ?? "-",
            "Cancel Date": data?.cancelDate ?? "-",
            "Rapid Status": data?.rapidStatus ?? false,
            "Anelto Status": data?.aneltoStatus ?? false,
            "Paired Equipment": data?.pairedEquipment ?? "-",
            "Contract Id": data?.contractId ?? "-",
        })
    }

    public static toListJson(data: SubscriberSummaryReportType[]) {
        return data.map(d => this.toJson(d)
        )
    }

    public static toDto(
        subscriber: any,
        topLevelOrg: any,
        childOrg: any,
        timezone: any,
        subscriberVital: any,
        orderDetails: OrderDetailsType,
        subscriberDevice: any,
        vitalCount: any,
        subscriberVitalTakenDates: any,
        deviceLog: any,
        subscriberProfile: FetchSubscriberProfileType,
        shippingInfo: FetchShippingInfoType
    ): SubscriberSummaryReportType {
        let count = 0;
        if (subscriberVitalTakenDates?.recordedOn) {
          const uniqueDays = extractUniqueDays(
            subscriberVitalTakenDates?.recordedOn,
            timezone
          );
          count = uniqueDays.length;
        }
        let addressInfo: SubscriberProfileAddresses['address'] =
            subscriberProfile?.addresses
                ?.find(address => address?.types?.includes('Main'))
                ?.address ?? subscriberProfile?.addresses?.[0]?.address

        let phoneNumber1: string, phoneNumber2: string;
        const mainNumber = subscriberProfile?.phoneNumbers
            ?.find(number => number?.type?.includes('Main'))?.number

        if (mainNumber) {
            phoneNumber1 = mainNumber;
            phoneNumber2 = subscriberProfile?.phoneNumbers
                ?.find(number => !number?.type?.includes('Main'))?.number as string
        } else {
            phoneNumber1 = subscriberProfile?.phoneNumbers?.[0]?.number;
            phoneNumber2 = subscriberProfile?.phoneNumbers?.[1]?.number;
        }

        return ({
            orderCode: orderDetails?.order?.code,
            whoPlacedOrder: orderDetails?.orderActivity?.orderPlacedBy,
            orderDate: orderDetails?.orderActivity?.orderDate,
            subscriberId: subscriber?.id,
            xmit: subscriberDevice?.xmit,
            mrnNumber: subscriber?.metadata?.mrn ? subscriber?.metadata?.mrn : subscriber?.metadata?.patientId,
            firstName: subscriber?.first_name,
            lastName: subscriber?.last_name,
            addressLine1: addressInfo?.addressLine1,
            addressLine2: addressInfo?.addressLine2,
            city: addressInfo?.city,
            state: addressInfo?.stateProvinceCode,
            zip: addressInfo?.postalCode,
            phoneNumber1: phoneNumber1,
            phoneNumber2: phoneNumber2,
            contactEmailAddress: subscriber?.contact_email_address,
            parentOrganization: topLevelOrg?.display_name,
            childOrganization: childOrg?.display_name,
            firstVitalDate: subscriberVital?.first_date,
            lastVitalDate: subscriberVital?.last_date,
            vitalCount: vitalCount?.total_vital_signs,
            uniqueDaysVitalsTaken: count,
            trackingNumber: orderDetails?.shipmentDetails?.trackingNumber,
            shippedDate: orderDetails?.shipmentDetails?.shipDate,
            trackingStatus: shippingInfo?.trackingInfo?.status,
            trackingStatusTimestamp: shippingInfo?.trackingInfo?.statusTimeStamp,
            shipAddressLine1: orderDetails?.shippingAddress?.addressLine1,
            shipAddressLine2: orderDetails?.shippingAddress?.addressLine2,
            shipCountry: orderDetails?.shippingAddress?.countryCode,
            shipCity: orderDetails?.shippingAddress?.city,
            shipState: orderDetails?.shippingAddress?.stateProvinceCode,
            shipZip: orderDetails?.shippingAddress?.postalCode,
            monthlyFee: orderDetails?.total?.monthlyFee,
            cancelDate: orderDetails?.orderActivity?.cancelDate,
            rapidStatus: deviceLog?.product_type?.includes('rapid.emergency-response'),
            aneltoStatus: deviceLog?.product_type?.includes('anelto.pro-health-console'),
            pairedEquipment: orderDetails?.pairedEquipment,
            contractId: orderDetails?.contractId
        })
    }

    public static toListDto(
        subscribers: any[],
        topLevelOrg: any,
        organizations: any[],
        timezones: any[],
        subscriberVitals: any[],
        orderDetails: OrderDetailsType[] | any[],
        subscriberDevices: any[],
        vitalsCount: any[],
        subscriberVitalTakenDates: any[],
        deviceLog: any[],
        subscriberProfiles: FetchSubscriberProfileType[] | any[],
        shippingInfo: FetchShippingInfoType[] | any[]
    ) {
        return subscribers.map(subscriber =>
            this.toDto(
                subscriber,
                topLevelOrg,
                organizations?.find(org => org?.id === subscriber.organization_id),
                timezones,
                subscriberVitals?.find(vital => vital?.subscriber_id === subscriber.id),
                orderDetails?.find(o => o?.subscriberId === subscriber.id),
                subscriberDevices?.find(x => x?.subscriber_id === subscriber.id),
                vitalsCount?.find(x => x?.subscriber_id === subscriber.id),
                subscriberVitalTakenDates?.find(
                    (x) => x?.subscriberId === subscriber.id
                ),
                deviceLog?.find(x => x?.subscriber_id === subscriber.id),
                subscriberProfiles?.find(x => x?.id === subscriber.id),
                shippingInfo.find(x => x.subscriberId === subscriber.id)
            )
        )
    }
}

const extractUniqueDays = (dateStrings: string[], timezone:string): number[] => {
    const uniqueDaysSet = new Set<number>();
  
    for (const dateString of dateStrings) {
      let vitalsDate = new Date(dateString);
      vitalsDate.setHours(vitalsDate.getHours() - 7);
      const day = vitalsDate.getDate();
      uniqueDaysSet.add(day);
    }
  
    const uniqueDaysArray = Array.from(uniqueDaysSet);
    return uniqueDaysArray;
};
  