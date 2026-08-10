"use client";

import {
  Boxes,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  PackageCheck,
  Phone,
  Printer,
  Truck,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { useLanguage } from "@/context/LanguageContext";

type DriverActivePanel = "ORDERS" | "STOCK" | "CUSTOMERS" | "NEW_CUSTOMER";

type CurrentDriver = {
  firstName: string | null;
  lastName: string | null;
};

type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type DriverCustomer = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
  customerType: string | null;
  name: string;
  address: string | null;
};

type DriverStockApiSummary = {
  currentTripLoadedValue: number;
};

type DriverStockSummary = {
  productId: string;
  displayName: { tr: string; de: string };
  stockUnit: string;
  packageInfo: string | null;
  imageUrl: string | null;
  salePrice: number;

  loadedQuantity: number;
  soldQuantity: number;
  returnedQuantity: number;
  adjustmentQuantity: number;
  currentQuantity: number;
};

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  pfand: number;
};

type PfandReturnItem = {
  id: string;
  name: string;
  quantity: number;
  approvedQuantity: number | null;
  unitAmount: number;
  totalAmount: number;
  approvedTotal: number | null;
};

type PfandReturn = {
  id: string;
  status: string;
  totalAmount: number;
  approvedAmount: number | null;
  items: PfandReturnItem[];
};

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryAddress: string;
  customerNote: string | null;
  driverNote: string | null;
  paymentStatus: "OPEN" | "PAID";
  paidAt: string | null;

  driverPaymentReportedAt: string | null;
  driverPaymentReportedAmount: number | null;
  paymentApprovedAt: string | null;
  paymentApprovedById: string | null;

  createdAt: string;
  subtotal: number;
  deliveryFee: number;
  pfandAmount: number;
  totalAmount: number;

  approvedPaymentAmount: number;
  pendingPaymentAmount: number;
  openPaymentAmount: number;
  accountStatus: "OPEN" | "CLOSED";

  user: {
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    phone: string | null;
    email: string;
  };

  items: OrderItem[];

  pfandReturns: PfandReturn[];
};

const statusLabels: Record<OrderStatus, { de: string; tr: string }> = {
  NEW: { de: "Neu", tr: "Yeni" },
  CONFIRMED: { de: "Bestätigt", tr: "Onaylandı" },
  PREPARING: { de: "Wird vorbereitet", tr: "Hazırlanıyor" },
  READY: { de: "Bereit", tr: "Hazır" },
  OUT_FOR_DELIVERY: { de: "Unterwegs", tr: "Teslimata Çıktı" },
  DELIVERED: { de: "Geliefert", tr: "Teslim Edildi" },
  CANCELLED: { de: "Storniert", tr: "İptal Edildi" },
};

const driverPfandTypes = [
  {
    key: "0.08",
    label: "0,08 € Pfand",
    unitAmount: 0.08,
  },
  {
    key: "0.15",
    label: "0,15 € Pfand",
    unitAmount: 0.15,
  },
  {
    key: "0.25",
    label: "0,25 € Pfand",
    unitAmount: 0.25,
  },
  {
    key: "3.30",
    label: "3,30 € Kasa",
    unitAmount: 3.3,
  },
] as const;

function getDriverStockUnitLabel(unit: string, language: "de" | "tr" = "tr") {
  const labels: Record<string, { de: string; tr: string }> = {
    KASA: { de: "Kiste", tr: "kasa" },
    KARTON: { de: "Karton", tr: "karton" },
    PAKET: { de: "Paket", tr: "paket" },
    ADET: { de: "Stück", tr: "adet" },
  };

  const entry = labels[unit];

  if (entry) {
    return language === "de" ? entry.de : entry.tr;
  }

  return language === "de"
    ? unit.toLocaleLowerCase("de-DE")
    : unit.toLocaleLowerCase("tr-TR");
}

export default function DriverPage() {
  const { language } = useLanguage();

  const t =
    language === "de"
      ? {
          defaultDriverName: "Fahrer",
          panelSubtitle: "Fahrerpanel",
          logout: "Abmelden",

          incomingOrders: "Eingehende Bestellungen",
          incomingOrdersDesc:
            "Zeigt Ihre aktiven Bestellungen und Lieferungen an.",
          vehicleStock: "Mein Fahrzeugbestand",
          vehicleStockDesc:
            "Geladene, verkaufte und aktuell im Fahrzeug verbleibende Produkte",
          customersNav: "Kunden",
          customersNavDesc:
            "Zeigt registrierte Kunden an und ermöglicht den Verkauf.",
          newCustomerNav: "Neuer Kunde",
          newCustomerNavDesc:
            "Neuen Firmen- oder Privatkunden im System anlegen.",
          stateOpen: "Offen",
          stateShow: "Anzeigen",
          stateCreate: "Erstellen",

          registeredCustomers: "Registrierte Kunden",
          registeredCustomersDesc:
            "Alle aktiven Kunden, angelegt von Admin, Fahrer oder per Kundenregistrierung.",
          customerCount: (count: number) => `${count} Kunden`,
          customerSearchPlaceholder:
            "Name, Firma, Telefon, E-Mail oder Adresse suchen...",
          customersLoading: "Kunden werden geladen...",
          noCustomersFound: "Keine passenden Kunden gefunden.",
          typePrivate: "Privat",
          typeBusiness: "Firma",
          phone: "Telefon:",
          email: "E-Mail:",
          address: "Adresse:",
          noAddressOnFile: "Keine Adresse hinterlegt",
          sell: "Verkauf starten",

          newCustomerTitle: "Neuen Kunden anlegen",
          newCustomerDesc:
            "Falls der Kunde nicht in der Liste ist, hier die Daten eingeben und im System speichern.",
          customerTypeLabel: "Kundentyp",
          businessOption: "Firma",
          privateOption: "Privatkunde",
          companyNameLabel: "Firmenname *",
          companyNamePlaceholder: "Firmenname",
          firstNameLabel: "Vorname *",
          firstNamePlaceholder: "Vorname",
          lastNameLabel: "Nachname",
          lastNamePlaceholder: "Nachname",
          phoneFieldLabel: "Telefon *",
          phonePlaceholder: "Telefonnummer",
          emailFieldLabel: "E-Mail",
          emailPlaceholder: "E-Mail (optional)",
          streetLabel: "Straße",
          streetPlaceholder: "Straße",
          houseNumberLabel: "Hausnummer",
          houseNumberPlaceholder: "Hausnummer",
          postalCodeLabel: "PLZ",
          postalCodePlaceholder: "PLZ",
          cityLabel: "Stadt",
          cityPlaceholder: "Stadt",
          cancel: "Abbrechen",
          saving: "Wird gespeichert...",
          saveCustomer: "Kunde speichern",

          saleFromVehicle: "Verkauf ab Fahrzeug an Kunden",
          backToCustomerList: "Zurück zur Kundenliste",
          vehicleStockLoading: "Fahrzeugbestand wird geladen...",
          noSellableProducts: "Keine verkaufbaren Produkte im Fahrzeug.",
          noPackageInfo: "Keine Verpackungsinfo",
          inVehicle: "Im Fahrzeug",
          unitPrice: "Stückpreis",
          saleQuantity: "Verkaufsmenge",
          lineTotal: "Zeilensumme",
          product: "Produkt",

          paymentMethodTitle: "Zahlungsart",
          paymentMethodDesc: "Zahlungsart des Kunden auswählen.",
          required: "Pflichtfeld",
          cash: "Bar",
          cashDesc: "Geld wurde vom Fahrer entgegengenommen",
          card: "Karte",
          cardDesc: "Zahlung per Karte erfolgt",
          openAccount: "Offene Rechnung",
          openAccountDesc: "Zahlung erfolgt später",
          selected: "Ausgewählt",
          selectedPayment: "Gewählte Zahlungsart:",

          pfandFromCustomerTitle: "Vom Kunden erhaltenes Pfand",
          pfandFromCustomerDesc:
            "Vom Kunden zurückgegebene Leergut-Kästen oder -Flaschen eintragen. Der Pfandbetrag wird vom Verkaufsbetrag abgezogen.",
          pfandReturn: "Pfandrückgabe",
          saleNote: "Verkaufsnotiz",
          saleNotePlaceholder: "Optionale Verkaufsnotiz...",
          saleTotal: "Verkaufssumme",
          productSum: "Produktsumme",
          pfandGivenByCustomer: "Vom Kunden zurückgegebenes Pfand",
          amountDue: "Vom Kunden zu erhalten",
          savingSale: "Verkauf wird gespeichert...",
          completeSale: "Verkauf abschließen",

          tripLoadedValueTitle: "Geladener Warenwert dieser Tour",
          tripLoadedValueDesc:
            "Bleibt bis zur vollständigen Entladung des Fahrzeugs unverändert",
          remainingValueTitle: "Verbleibender Warenwert im Fahrzeug",
          remainingValueDesc:
            "Verkaufswert der aktuell im Fahrzeug vorhandenen Produkte",
          soldValueTitle: "Wert der verkauften Ware",
          soldValueDesc: "Verkaufswert der vom Fahrer verkauften Produkte",
          stockEmpty:
            "Noch keine Produkte im Fahrzeugbestand oder in den Lagerbewegungen.",
          loaded: "Geladen",
          outgoingValue: "Ausgangswert",
          sold: "Verkauft",
          remainingValue: "Restwert",
          remainingSuffix: "übrig",
          currentlyInVehicle: "im Fahrzeug vorhanden",
          currentInVehicleHeader: "Aktuell im Fahrzeug",

          deliveredTitle: "Zugestellt",
          activeDeliveriesTitle: "Aktive Lieferungen",
          deliveredDesc: "Sie sehen die von Ihnen zugestellten Bestellungen.",
          activeDeliveriesDesc:
            "Sie sehen die noch nicht zugestellten Bestellungen.",
          showActiveDeliveries: "Aktive Lieferungen anzeigen",
          endOfDay: "Tagesabschluss",
          customerSearchPlaceholder2: "Kunde suchen...",
          deliveredOrderCount: "Zugestellte Bestellungen",
          totalSales: "Gesamtumsatz",
          ordersLoading: "Lieferungen werden geladen...",
          noDeliveredOrders: "Noch keine zugestellten Bestellungen.",
          noActiveOrders: "Keine aktiven Bestellungen zugewiesen.",
          status: "Status",
          total: "Gesamt",
          payment: "Zahlung",
          adminApproved: "Von Admin bestätigt",
          cashProcessed: "Betrag wurde in der Kasse verbucht",
          paymentReceived: "Zahlung erhalten",
          awaitingAdminApproval: "Wartet auf Kassenbestätigung durch Admin",
          reportedAmount: "Gemeldeter Betrag",
          openInOrder: "Offener Betrag",
          pendingApprovalNote:
            "Die gemeldete Zahlung wird nach Bestätigung durch den Admin vom offenen Betrag abgezogen.",
          revertPaymentReport: "Zahlungsmeldung zurücknehmen",
          paymentOpen: "Zahlung offen",
          remainingOpenAmount: "Verbleibender offener Betrag",
          previouslyApproved: "Bisher bestätigt:",
          noApprovedPaymentYet: "Noch keine bestätigte Zahlung vorhanden",
          receivedFromCustomer: "Vom Kunden erhalten",
          amountPlaceholder: "0,00",
          remainingOpen: "Bleibt offen",
          reporting: "Wird gemeldet...",
          reportPayment: "Zahlung melden",
          markDelivered: "Als zugestellt markieren",
          startDelivery: "Lieferung gestartet",
          waitingConfirmation: "Wartet auf Bestätigung",
          deliveredBadge: "Zugestellt",
          printReceipt: "Beleg drucken",
          deliveryAddress: "Lieferadresse",
          customer: "Kunde",
          noPhone: "Keine Telefonnummer",
          orderItems: "Bestellte Artikel",
          quantity: "Menge:",
          customerNote: "Kundennotiz",
          pfandReturnDesc:
            "Prüfen Sie die vom Kunden gemeldete Menge und geben Sie die tatsächlich erhaltene Menge ein.",
          driverReceived: "Erhalten",
          unit: "Einheit:",
          savePfandAmount: "Pfandmenge speichern",
          pfandFinalized: "Pfand abgeschlossen",
          pfandDeliveryTitle: "Pfandabgabe",
          pfandDeliveryDesc:
            "Zählen Sie das vom Kunden zurückgegebene Pfand und ziehen Sie es vom zu zahlenden Betrag ab.",
          closePfandEntry: "Pfanderfassung schließen",
          enterPfand: "Pfand erfassen",
          orderDelivered: "Bestellung zugestellt",
          quantityPlaceholder: "Menge",
          receivedPfand: "Erhaltenes Pfand",
          savingPfand: "Pfand wird gespeichert...",
          savePfandAndDeduct: "Pfand speichern und vom Betrag abziehen",

          customersLoadError: "Kunden konnten nicht geladen werden.",
          customersLoadConnError: "Verbindungsfehler beim Laden der Kunden.",
          companyNameRequired: "Firmenname ist erforderlich.",
          nameRequired: "Bitte Vor- oder Nachnamen des Kunden eingeben.",
          phoneRequired: "Telefonnummer ist erforderlich.",
          customerCreateFailed: "Kunde konnte nicht angelegt werden.",
          customerFallbackName: "Kunde",
          customerCreated: (name: string) =>
            `${name} wurde erfolgreich angelegt.`,
          customerCreateConnError:
            "Verbindungsfehler beim Anlegen des Kunden.",
          noCustomerSelected: "Kein Kunde für den Verkauf ausgewählt.",
          noSaleItems:
            "Bitte mindestens ein Produkt und eine Menge für den Verkauf eingeben.",
          productNotInStock:
            "Ausgewähltes Produkt nicht im Fahrzeugbestand gefunden.",
          exceedsVehicleStock: (name: string, qty: number, unit: string) =>
            `Im Fahrzeug sind höchstens ${qty} ${unit} von ${name} vorhanden.`,
          saleFailed: "Kundenverkauf konnte nicht gespeichert werden.",
          saleSaved: (name: string) => `Verkauf für ${name} wurde gespeichert.`,
          saleConnError: "Verbindungsfehler beim Speichern des Verkaufs.",
          vehicleStockLoadFailed:
            "Fahrzeugbestandsdaten konnten nicht geladen werden.",
          vehicleStockLoadError:
            "Fehler beim Laden der Fahrzeugbestandsdaten.",
          ordersLoadFailed: "Lieferungen konnten nicht geladen werden.",
          ordersLoadError: "Fehler beim Laden der Lieferungen.",
          orderUpdateFailed: "Bestellung konnte nicht aktualisiert werden.",
          orderUpdated: "Bestellung wurde aktualisiert.",
          orderUpdateError: "Fehler beim Aktualisieren der Bestellung.",
          pfandQuantityRequired: "Bitte mindestens eine Pfandmenge eingeben.",
          pfandAlreadyExists:
            "Für diese Bestellung wurde bereits ein Pfandeintrag angelegt. Der bestehende Eintrag wurde neu geladen.",
          pfandCreateFailed: "Pfandeintrag konnte nicht angelegt werden.",
          pfandSaved: "Pfand wurde gespeichert.",
          pfandSaveError: "Fehler beim Speichern des Pfands.",
          pfandQuantitiesSaveFailed:
            "Pfandmengen konnten nicht gespeichert werden.",
          pfandQuantitiesSaved: "Pfandmengen wurden gespeichert.",
          pfandQuantitiesSaveError:
            "Fehler beim Speichern der Pfandmengen.",
        }
      : {
          defaultDriverName: "Şoför",
          panelSubtitle: "Şoför Paneli",
          logout: "Çıkış",

          incomingOrders: "Gelen Siparişler",
          incomingOrdersDesc:
            "Size atanan aktif siparişleri ve teslimatları görüntüleyin.",
          vehicleStock: "Araç Stoklarım",
          vehicleStockDesc:
            "Yüklenen, satılan ve araçta güncel kalan ürünler",
          customersNav: "Müşteriler",
          customersNavDesc: "Kayıtlı müşterileri görüntüleyin ve satış yapın.",
          newCustomerNav: "Yeni Müşteri",
          newCustomerNavDesc: "Sisteme yeni firma veya özel müşteri ekleyin.",
          stateOpen: "Açık",
          stateShow: "Göster",
          stateCreate: "Oluştur",

          registeredCustomers: "Kayıtlı Müşteriler",
          registeredCustomersDesc:
            "Admin, şoför veya müşteri kaydıyla oluşturulan bütün aktif müşteriler.",
          customerCount: (count: number) => `${count} müşteri`,
          customerSearchPlaceholder:
            "İsim, firma, telefon, e-posta veya adres ara...",
          customersLoading: "Müşteriler yükleniyor...",
          noCustomersFound: "Aramaya uygun kayıtlı müşteri bulunamadı.",
          typePrivate: "Özel",
          typeBusiness: "Firma",
          phone: "Telefon:",
          email: "E-posta:",
          address: "Adres:",
          noAddressOnFile: "Adres kaydı bulunmuyor",
          sell: "Satış Yap",

          newCustomerTitle: "Yeni Müşteri Oluştur",
          newCustomerDesc:
            "Müşteri listede yoksa bilgilerini girerek sisteme kaydedin.",
          customerTypeLabel: "Müşteri türü",
          businessOption: "Firma",
          privateOption: "Özel müşteri",
          companyNameLabel: "Firma adı *",
          companyNamePlaceholder: "Firma adı",
          firstNameLabel: "Ad *",
          firstNamePlaceholder: "Ad",
          lastNameLabel: "Soyad",
          lastNamePlaceholder: "Soyad",
          phoneFieldLabel: "Telefon *",
          phonePlaceholder: "Telefon numarası",
          emailFieldLabel: "E-posta",
          emailPlaceholder: "E-posta isteğe bağlı",
          streetLabel: "Sokak",
          streetPlaceholder: "Sokak",
          houseNumberLabel: "Kapı numarası",
          houseNumberPlaceholder: "Kapı numarası",
          postalCodeLabel: "Posta kodu",
          postalCodePlaceholder: "Posta kodu",
          cityLabel: "Şehir",
          cityPlaceholder: "Şehir",
          cancel: "İptal",
          saving: "Kaydediliyor...",
          saveCustomer: "Müşteriyi Kaydet",

          saleFromVehicle: "Müşteriye araçtan satış",
          backToCustomerList: "Müşteri Listesine Dön",
          vehicleStockLoading: "Araç stokları yükleniyor...",
          noSellableProducts: "Araçta satılabilecek ürün bulunmuyor.",
          noPackageInfo: "Paket bilgisi yok",
          inVehicle: "Araçta",
          unitPrice: "Birim fiyat",
          saleQuantity: "Satış miktarı",
          lineTotal: "Satır toplamı",
          product: "Ürün",

          paymentMethodTitle: "Ödeme Şekli",
          paymentMethodDesc: "Müşterinin ödeme türünü seçin.",
          required: "Zorunlu",
          cash: "Nakit",
          cashDesc: "Para şoför tarafından alındı",
          card: "Kart",
          cardDesc: "Kart ile ödeme yapıldı",
          openAccount: "Açık Hesap",
          openAccountDesc: "Ödeme daha sonra alınacak",
          selected: "Seçildi",
          selectedPayment: "Seçilen ödeme:",

          pfandFromCustomerTitle: "Müşteriden Alınan Pfand",
          pfandFromCustomerDesc:
            "Müşterinin verdiği boş kasa veya şişeleri girin. Pfand tutarı satış hesabından düşer.",
          pfandReturn: "Pfand İadesi",
          saleNote: "Satış notu",
          saleNotePlaceholder: "İsteğe bağlı satış notu...",
          saleTotal: "Satış toplamı",
          productSum: "Ürün toplamı",
          pfandGivenByCustomer: "Müşterinin verdiği Pfand",
          amountDue: "Müşteriden Alınacak",
          savingSale: "Satış Kaydediliyor...",
          completeSale: "Satışı Tamamla",

          tripLoadedValueTitle: "Bu Tur Yüklenen Mal Değeri",
          tripLoadedValueDesc: "Araç tamamen boşaltılana kadar sabit kalır",
          remainingValueTitle: "Araçta Kalan Mal Değeri",
          remainingValueDesc: "Araçta şu anda bulunan ürünlerin satış değeri",
          soldValueTitle: "Satılan Mal Değeri",
          soldValueDesc: "Şoförün sattığı ürünlerin satış değeri",
          stockEmpty:
            "Araç stokunda veya stok hareketlerinde henüz ürün bulunmuyor.",
          loaded: "Yüklenen",
          outgoingValue: "Giden Değeri",
          sold: "Satılan",
          remainingValue: "Kalan Değeri",
          remainingSuffix: "kaldı",
          currentlyInVehicle: "Araçta mevcut",
          currentInVehicleHeader: "Araçta Güncel",

          deliveredTitle: "Teslim Edilenler",
          activeDeliveriesTitle: "Aktif Teslimatlar",
          deliveredDesc: "Teslim ettiğiniz siparişleri görüntülüyorsunuz.",
          activeDeliveriesDesc:
            "Henüz teslim etmediğiniz siparişleri görüntülüyorsunuz.",
          showActiveDeliveries: "Aktif Teslimatları Göster",
          endOfDay: "Gün Sonu Kapat",
          customerSearchPlaceholder2: "Müşteri ara...",
          deliveredOrderCount: "Teslim Edilen Sipariş",
          totalSales: "Toplam Satış",
          ordersLoading: "Teslimatlar yükleniyor...",
          noDeliveredOrders: "Henüz teslim edilmiş sipariş bulunmuyor.",
          noActiveOrders: "Size atanmış aktif sipariş bulunmuyor.",
          status: "Durum",
          total: "Toplam",
          payment: "Ödeme",
          adminApproved: "Admin Onayladı",
          cashProcessed: "Para kasaya işlendi",
          paymentReceived: "Para Alındı",
          awaitingAdminApproval: "Admin kasa onayı bekleniyor",
          reportedAmount: "Bildirilen tutar",
          openInOrder: "Siparişte açık",
          pendingApprovalNote:
            "Bildirilen ödeme admin tarafından onaylandıktan sonra açık tutardan düşecektir.",
          revertPaymentReport: "Para Bildirimini Geri Al",
          paymentOpen: "Ödeme Açık",
          remainingOpenAmount: "Kalan açık tutar",
          previouslyApproved: "Daha önce onaylanan:",
          noApprovedPaymentYet: "Henüz onaylanmış ödeme bulunmuyor",
          receivedFromCustomer: "Müşteriden alınan",
          amountPlaceholder: "0,00",
          remainingOpen: "Açık kalacak",
          reporting: "Bildiriliyor...",
          reportPayment: "Ödemeyi Bildir",
          markDelivered: "Teslim Ettim",
          startDelivery: "Teslimata Çıktım",
          waitingConfirmation: "Onay bekleniyor",
          deliveredBadge: "Teslim Edildi",
          printReceipt: "Fiş Yazdır",
          deliveryAddress: "Teslimat Adresi",
          customer: "Müşteri",
          noPhone: "Telefon yok",
          orderItems: "Sipariş Ürünleri",
          quantity: "Adet:",
          customerNote: "Müşteri Notu",
          pfandReturnDesc:
            "Müşterinin bildirdiği miktarı kontrol edin ve gerçek alınan miktarı girin.",
          driverReceived: "Şoförün Aldığı",
          unit: "Birim:",
          savePfandAmount: "Pfand Miktarını Kaydet",
          pfandFinalized: "Pfand Kesinleşti",
          pfandDeliveryTitle: "Pfand Teslimi",
          pfandDeliveryDesc:
            "Müşterinin verdiği Pfandları sayın ve müşteriden alınacak tutardan düşün.",
          closePfandEntry: "Pfand Girişini Kapat",
          enterPfand: "Pfand Gir",
          orderDelivered: "Sipariş Teslim Edildi",
          quantityPlaceholder: "Adet",
          receivedPfand: "Alınan Pfand",
          savingPfand: "Pfand Kaydediliyor...",
          savePfandAndDeduct: "Pfandı Kaydet ve Hesaptan Düş",

          customersLoadError: "Müşteriler yüklenemedi.",
          customersLoadConnError:
            "Müşteriler yüklenirken bağlantı hatası oluştu.",
          companyNameRequired: "Firma adı zorunludur.",
          nameRequired: "Müşterinin adını veya soyadını girin.",
          phoneRequired: "Telefon numarası zorunludur.",
          customerCreateFailed: "Müşteri oluşturulamadı.",
          customerFallbackName: "Müşteri",
          customerCreated: (name: string) => `${name} başarıyla oluşturuldu.`,
          customerCreateConnError:
            "Müşteri oluşturulurken bağlantı hatası oluştu.",
          noCustomerSelected: "Satış yapılacak müşteri seçilmedi.",
          noSaleItems: "Satılacak en az bir ürün ve miktar girin.",
          productNotInStock: "Seçilen ürün araç stokunda bulunamadı.",
          exceedsVehicleStock: (name: string, qty: number, unit: string) =>
            `${name} için araçta en fazla ${qty} ${unit} bulunuyor.`,
          saleFailed: "Müşteri satışı kaydedilemedi.",
          saleSaved: (name: string) => `${name} için satış kaydedildi.`,
          saleConnError: "Satış kaydedilirken bağlantı hatası oluştu.",
          vehicleStockLoadFailed: "Araç stok bilgileri yüklenemedi.",
          vehicleStockLoadError: "Araç stok bilgileri yüklenirken hata oluştu.",
          ordersLoadFailed: "Teslimatlar yüklenemedi.",
          ordersLoadError: "Teslimatlar yüklenirken hata oluştu.",
          orderUpdateFailed: "Sipariş güncellenemedi.",
          orderUpdated: "Sipariş güncellendi.",
          orderUpdateError: "Sipariş güncellenirken hata oluştu.",
          pfandQuantityRequired: "En az bir Pfand adedi girin.",
          pfandAlreadyExists:
            "Bu sipariş için Pfand kaydı zaten oluşturulmuş. Mevcut kayıt yeniden yüklendi.",
          pfandCreateFailed: "Pfand kaydı oluşturulamadı.",
          pfandSaved: "Pfand kaydedildi.",
          pfandSaveError: "Pfand kaydedilirken hata oluştu.",
          pfandQuantitiesSaveFailed: "Pfand miktarları kaydedilemedi.",
          pfandQuantitiesSaved: "Pfand miktarları kaydedildi.",
          pfandQuantitiesSaveError:
            "Pfand miktarları kaydedilirken hata oluştu.",
        };

  const [currentDriver, setCurrentDriver] = useState<CurrentDriver | null>(
    null,
  );

  const [orders, setOrders] = useState<Order[]>([]);

  const [driverStocks, setDriverStocks] = useState<DriverStockSummary[]>([]);

  const [driverStockSummary, setDriverStockSummary] =
    useState<DriverStockApiSummary>({
      currentTripLoadedValue: 0,
    });

  const [driverStockLoading, setDriverStockLoading] = useState(true);

  const [driverStockError, setDriverStockError] = useState("");

  const [activePanel, setActivePanel] = useState<DriverActivePanel>("ORDERS");

  const [showDriverStock, setShowDriverStock] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [success, setSuccess] = useState("");

  const [historySearch, setHistorySearch] = useState("");
  const [historyDate, setHistoryDate] = useState("");


  /*
   * Her sipariş için şoförün müşteriden fiilen aldığı tutar.
   * Anahtar: Sipariş ID
   * Değer: Input içindeki tutar
   */
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>(
    {},
  );

  const [paymentMethods, setPaymentMethods] = useState<
    Record<string, "CASH" | "CARD">
  >({});

  const [pfandQuantities, setPfandQuantities] = useState<
    Record<string, number>
  >({});

  const [newPfandOrderId, setNewPfandOrderId] = useState<string | null>(null);

  const [newPfandValues, setNewPfandValues] = useState<Record<string, string>>(
    {},
  );

  const [showDelivered, setShowDelivered] = useState(false);

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [customers, setCustomers] = useState<DriverCustomer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [customerError, setCustomerError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  /*
   * Müşteri kartına tıklanınca açılan araçtan satış ekranı.
   */
  const [selectedSaleCustomer, setSelectedSaleCustomer] =
    useState<DriverCustomer | null>(null);

  const [driverSaleQuantities, setDriverSaleQuantities] = useState<
    Record<string, string>
  >({});

  const [driverSalePaymentMethod, setDriverSalePaymentMethod] = useState<
    "CASH" | "CARD" | "OPEN"
  >("CASH");

  const [driverSaleNote, setDriverSaleNote] = useState("");

  /*
   * Araçtan satış sırasında müşteriden alınan boş kasa/şişe Pfandları.
   * Anahtar: driverPfandTypes içindeki Pfand anahtarı
   * Değer: Müşterinin verdiği adet
   */
  const [driverSalePfandValues, setDriverSalePfandValues] = useState<
    Record<string, string>
  >({});

  const [savingDriverSale, setSavingDriverSale] = useState(false);
  const [driverSaleError, setDriverSaleError] = useState("");

  const [customerForm, setCustomerForm] = useState({
    customerType: "BUSINESS",
    companyName: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
  });

  async function loadCurrentDriver() {
    try {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        return;
      }

      setCurrentDriver({
        firstName: data.user?.firstName || null,
        lastName: data.user?.lastName || null,
      });
    } catch {
      /*
       * Şoför adı yüklenemese bile panel çalışmaya devam eder.
       */
    }
  }

  async function loadCustomers(silent = false) {
    if (!silent) {
      setCustomerLoading(true);
    }

    setCustomerError("");

    try {
      const response = await fetch("/api/driver/customers", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setCustomerError(data.error || t.customersLoadError);
        return;
      }

      setCustomers(data.customers || []);
    } catch {
      setCustomerError(t.customersLoadConnError);
    } finally {
      if (!silent) {
        setCustomerLoading(false);
      }
    }
  }

  function updateCustomerField(field: string, value: string) {
    setCustomerForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function clearCustomerForm() {
    setCustomerForm({
      customerType: "BUSINESS",
      companyName: "",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
    });
  }

  async function createCustomer() {
    if (
      customerForm.customerType === "BUSINESS" &&
      !customerForm.companyName.trim()
    ) {
      setError(t.companyNameRequired);
      return;
    }

    if (
      customerForm.customerType === "PRIVATE" &&
      !customerForm.firstName.trim() &&
      !customerForm.lastName.trim()
    ) {
      setError(t.nameRequired);
      return;
    }

    if (!customerForm.phone.trim()) {
      setError(t.phoneRequired);
      return;
    }

    setSavingCustomer(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/driver/customers", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(customerForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.customerCreateFailed);
        return;
      }

      setSuccess(
        t.customerCreated(data.customer?.name || t.customerFallbackName),
      );

      clearCustomerForm();

      await loadCustomers(true);

      setShowCustomerForm(false);
      setActivePanel("CUSTOMERS");
      setCustomerSearch("");
    } catch {
      setError(t.customerCreateConnError);
    } finally {
      setSavingCustomer(false);
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const normalizedSearch = customerSearch.trim().toLocaleLowerCase("tr-TR");

    if (!normalizedSearch) {
      return true;
    }

    return [
      customer.name,
      customer.companyName,
      customer.firstName,
      customer.lastName,
      customer.phone,
      customer.email,
      customer.address,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("tr-TR")
      .includes(normalizedSearch);
  });

  function openCustomerSale(customer: DriverCustomer) {
    setSelectedSaleCustomer(customer);
    setDriverSaleQuantities({});
    setDriverSalePaymentMethod("CASH");
    setDriverSaleNote("");
    setDriverSalePfandValues({});
    setDriverSaleError("");
    setError("");
    setSuccess("");

    /*
     * Müşteriye tıklandığında en güncel araç stoğunu getir.
     */
    loadDriverStocks();
  }

  function closeCustomerSale() {
    setSelectedSaleCustomer(null);
    setDriverSaleQuantities({});
    setDriverSalePaymentMethod("CASH");
    setDriverSaleNote("");
    setDriverSalePfandValues({});
    setDriverSaleError("");
  }

  function getSelectedDriverSaleItems() {
    return driverStocks
      .map((stock) => ({
        productId: stock.productId,
        quantity: Number(driverSaleQuantities[stock.productId] || 0),
      }))
      .filter((item) => Number.isInteger(item.quantity) && item.quantity > 0);
  }

  function getDriverSaleSubtotal() {
    return Number(
      driverStocks
        .reduce((total, stock) => {
          const quantity = Number(driverSaleQuantities[stock.productId] || 0);

          if (!Number.isFinite(quantity) || quantity <= 0) {
            return total;
          }

          return total + quantity * stock.salePrice;
        }, 0)
        .toFixed(2),
    );
  }

  function getDriverSalePfandItems() {
    return driverPfandTypes
      .map((pfandType) => {
        const quantity = Number(driverSalePfandValues[pfandType.key] || 0);

        return {
          key: pfandType.key,
          name: pfandType.label,
          quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 0,
          unitAmount: pfandType.unitAmount,
        };
      })
      .filter((item) => item.quantity > 0);
  }

  function getDriverSalePfandReturnTotal() {
    return Number(
      getDriverSalePfandItems()
        .reduce((total, item) => total + item.quantity * item.unitAmount, 0)
        .toFixed(2),
    );
  }

  function getDriverSalePayableTotal() {
    return Math.max(
      0,
      Number(
        (getDriverSaleSubtotal() - getDriverSalePfandReturnTotal()).toFixed(2),
      ),
    );
  }

  async function submitDriverSale() {
    if (!selectedSaleCustomer) {
      setDriverSaleError(t.noCustomerSelected);
      return;
    }

    const items = getSelectedDriverSaleItems();

    if (items.length === 0) {
      setDriverSaleError(t.noSaleItems);
      return;
    }

    for (const item of items) {
      const stock = driverStocks.find(
        (currentStock) => currentStock.productId === item.productId,
      );

      if (!stock) {
        setDriverSaleError(t.productNotInStock);
        return;
      }

      if (item.quantity > stock.currentQuantity) {
        setDriverSaleError(
          t.exceedsVehicleStock(
            stock.displayName[language],
            stock.currentQuantity,
            getDriverStockUnitLabel(stock.stockUnit, language),
          ),
        );
        return;
      }
    }

    setSavingDriverSale(true);
    setDriverSaleError("");
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/driver/sales", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          customerId: selectedSaleCustomer.id,
          paymentMethod: driverSalePaymentMethod,
          note: driverSaleNote.trim(),
          items,
          pfandItems: getDriverSalePfandItems(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDriverSaleError(data.error || t.saleFailed);
        return;
      }

      setSuccess(data.message || t.saleSaved(selectedSaleCustomer.name));

      if (data?.order?.id) {
        window.open(
          `/driver/receipt/${data.order.id}?lang=${language}`,
          "_blank",
          "width=420,height=900"
        );
      }

      setSelectedSaleCustomer(null);
      setDriverSaleQuantities({});
      setDriverSalePaymentMethod("CASH");
      setDriverSaleNote("");
      setDriverSalePfandValues({});
      setDriverSaleError("");

      /*
       * Satıştan sonra araç stoğu ve sipariş kayıtları yenilenir.
       */
      await Promise.all([
        loadDriverStocks(),
        loadOrders(),
        loadCustomers(true),
      ]);
    } catch {
      setDriverSaleError(t.saleConnError);
    } finally {
      setSavingDriverSale(false);
    }
  }

  async function loadDriverStocks() {
    setDriverStockLoading(true);
    setDriverStockError("");

    try {
      const response = await fetch("/api/driver/stock", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setDriverStockError(data.error || t.vehicleStockLoadFailed);

        return;
      }

      setDriverStocks(data.stocks || []);

      setDriverStockSummary({
        currentTripLoadedValue: Number(
          data.summary?.currentTripLoadedValue || 0,
        ),
      });
    } catch {
      setDriverStockError(t.vehicleStockLoadError);
    } finally {
      setDriverStockLoading(false);
    }
  }

  async function loadOrders(silent = false) {
    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      const response = await fetch("/api/driver/orders");

      const data = await response.json();

      if (!response.ok) {
        if (!silent) {
          setError(data.error || t.ordersLoadFailed);
        }
        return;
      }

      setOrders(data.orders);
    } catch {
      if (!silent) {
        setError(t.ordersLoadError);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }


  useEffect(() => {
    loadCurrentDriver();
    loadOrders();
    loadDriverStocks();
    loadCustomers();

    const interval = setInterval(() => {
      loadOrders(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);


  const deliveredOrders = orders.filter((order) => {
    if (order.status !== "DELIVERED") return false;

    const customerName = (
      order.user.companyName ||
      `${order.user.firstName ?? ""} ${order.user.lastName ?? ""}`
    ).toLowerCase();

    if (
      historySearch &&
      !customerName.includes(historySearch.toLowerCase())
    ) {
      return false;
    }

    if (historyDate) {
      return (
        new Date(order.createdAt).toISOString().slice(0, 10) === historyDate
      );
    }

    return true;
  });

  const deliveredOrderCount = deliveredOrders.length;

  const deliveredOrderTotal = deliveredOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0,
  );


  async function updateDeliveryStatus(
    order: Order,
    action: "OUT_FOR_DELIVERY" | "DELIVERED" | "PAID" | "OPEN_PAYMENT",
    reportedAmount?: number,
  ) {
    setUpdatingOrderId(order.id);

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/driver/orders/${order.id}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action,

          ...(action === "PAID"
            ? {
                amount: reportedAmount,
                paymentMethod: paymentMethods[order.id] || "CASH",
              }
            : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.orderUpdateFailed);
        return;
      }

      /*
       * PATCH cevabı hesaplanan ödeme alanlarını içermeyebilir.
       * Bu nedenle eksik data.order nesnesini state'e yazmak yerine
       * siparişleri tam API cevabıyla yeniden yüklüyoruz.
       */
      await loadOrders();

      if (action === "PAID") {
        setPaymentAmounts((current) => ({
          ...current,
          [order.id]: "",
        }));
      }

      setSuccess(data.message || t.orderUpdated);
    } catch {
      setError(t.orderUpdateError);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function resetNewPfandForm() {
    setNewPfandValues({});
  }

  function getNewPfandTotal() {
    return Number(
      driverPfandTypes
        .reduce((total, pfandType) => {
          const quantity = Number(newPfandValues[pfandType.key] || 0);

          return total + quantity * pfandType.unitAmount;
        }, 0)
        .toFixed(2),
    );
  }

  async function createPfand(order: Order) {
    const pfandItems = driverPfandTypes.map((pfandType) => ({
      key: pfandType.key,

      quantity: Number(newPfandValues[pfandType.key] || 0),
    }));

    if (getNewPfandTotal() <= 0) {
      setError(t.pfandQuantityRequired);
      return;
    }

    setUpdatingOrderId(order.id);

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/driver/orders/${order.id}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "CREATE_PFAND",

          pfandItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 409 &&
          data.error === "Bu sipariş için zaten bir Pfand kaydı bulunuyor."
        ) {
          await loadOrders();

          setNewPfandOrderId(null);
          resetNewPfandForm();

          setError(t.pfandAlreadyExists);

          return;
        }

        setError(data.error || t.pfandCreateFailed);
        return;
      }

      setOrders((current) =>
        current.map((currentOrder) =>
          currentOrder.id === order.id ? data.order : currentOrder,
        ),
      );

      setNewPfandOrderId(null);

      resetNewPfandForm();

      setSuccess(data.message || t.pfandSaved);
    } catch {
      setError(t.pfandSaveError);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function getDriverOrderTotal(order: Order) {
    const pfandReturn = order.pfandReturns[0];

    const pfandReturnAmount = pfandReturn
      ? pfandReturn.items.reduce(
          (total, item) => total + getPfandQuantity(item) * item.unitAmount,
          0,
        )
      : 0;

    return Math.max(
      0,
      order.subtotal +
        order.pfandAmount +
        order.deliveryFee -
        pfandReturnAmount,
    );
  }

  function getDriverOpenPaymentAmount(order: Order) {
    return Number(
      Math.max(
        0,
        Number(
          order.openPaymentAmount ??
            Number(order.totalAmount || 0) -
              Number(order.approvedPaymentAmount || 0),
        ),
      ).toFixed(2),
    );
  }

  function getPfandQuantity(item: PfandReturnItem) {
    if (pfandQuantities[item.id] !== undefined) {
      return pfandQuantities[item.id];
    }

    return item.quantity;
  }

  function changePfandQuantity(item: PfandReturnItem, difference: number) {
    const current = getPfandQuantity(item);

    const next = Math.max(0, current + difference);

    setPfandQuantities((previous) => ({
      ...previous,

      [item.id]: next,
    }));
  }

  function setPfandQuantity(item: PfandReturnItem, value: number) {
    const next = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));

    setPfandQuantities((previous) => ({
      ...previous,

      [item.id]: next,
    }));
  }

  async function savePfand(order: Order) {
    const pfandReturn = order.pfandReturns[0];

    if (!pfandReturn) {
      return;
    }

    setUpdatingOrderId(order.id);

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/driver/orders/${order.id}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "UPDATE_PFAND",

          pfandItems: pfandReturn.items.map((item) => ({
            id: item.id,

            approvedQuantity: getPfandQuantity(item),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.pfandQuantitiesSaveFailed);

        return;
      }

      await loadOrders();

      setPfandQuantities((previous) => {
        const next = {
          ...previous,
        };

        for (const item of pfandReturn.items) {
          delete next[item.id];
        }

        return next;
      });

      setSuccess(data.message || t.pfandQuantitiesSaved);
    } catch {
      setError(t.pfandQuantitiesSaveError);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 p-2 sm:p-3 lg:p-4">
      <div className="w-full max-w-none">
        <section className="rounded-[32px] bg-slate-950 p-7 text-white sm:p-10">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
                <Truck size={28} />
              </div>

              <h1 className="mt-5 text-4xl font-black">
                {[currentDriver?.firstName, currentDriver?.lastName]
                  .filter(Boolean)
                  .join(" ") || t.defaultDriverName}
              </h1>

              <p className="mt-3 text-slate-400">{t.panelSubtitle}</p>
            </div>

            <LogoutButton
              variant="dark"
              label={t.logout}
            />
          </div>
        </section>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setActivePanel("ORDERS");
              setShowDriverStock(false);
              setShowCustomerForm(false);
            }}
            className="flex h-full w-full items-center justify-between gap-4 rounded-2xl bg-orange-500 p-4 text-left text-white shadow-sm transition hover:bg-orange-600"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                <PackageCheck size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black">{t.incomingOrders}</h2>

                <p className="mt-0.5 text-xs text-orange-50">
                  {t.incomingOrdersDesc}
                </p>
              </div>
            </div>

            <span className="rounded-xl bg-white px-4 py-2 text-sm font-black text-orange-600">
              {activePanel === "ORDERS" ? t.stateOpen : t.stateShow}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePanel("STOCK");
              setShowDriverStock(true);
              setShowCustomerForm(false);
              loadDriverStocks();
            }}
            className="flex h-full w-full items-center justify-between gap-4 rounded-2xl bg-white p-4 text-left shadow-sm transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <Boxes size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-950">
                  {t.vehicleStock}
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {t.vehicleStockDesc}
                </p>
              </div>
            </div>

            <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
              {activePanel === "STOCK" ? t.stateOpen : t.stateShow}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePanel("CUSTOMERS");
              setShowDriverStock(false);
              setShowCustomerForm(false);
              setSelectedSaleCustomer(null);
              setDriverSaleError("");
              loadCustomers();
            }}
            className={`flex h-full w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left shadow-sm transition ${
              activePanel === "CUSTOMERS"
                ? "border-green-600 bg-green-600 text-white"
                : "border-green-200 bg-green-50 text-green-950 hover:bg-green-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  activePanel === "CUSTOMERS"
                    ? "bg-white/20 text-white"
                    : "bg-white text-green-600"
                }`}
              >
                <UserPlus size={18} />
              </div>

              <div>
                <h2 className="text-base font-black">{t.customersNav}</h2>

                <p
                  className={`mt-0.5 text-xs ${
                    activePanel === "CUSTOMERS"
                      ? "text-green-50"
                      : "text-green-700"
                  }`}
                >
                  {t.customersNavDesc}
                </p>
              </div>
            </div>

            <span
              className={`rounded-lg px-3 py-1.5 text-xs font-black ${
                activePanel === "CUSTOMERS"
                  ? "bg-white text-green-700"
                  : "bg-green-600 text-white"
              }`}
            >
              {activePanel === "CUSTOMERS" ? t.stateOpen : t.stateShow}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePanel("NEW_CUSTOMER");
              setShowDriverStock(false);
              setShowCustomerForm(true);
              setSelectedSaleCustomer(null);
              setDriverSaleError("");
              setError("");
              setSuccess("");
              clearCustomerForm();
            }}
            className={`flex h-full w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left shadow-sm transition ${
              activePanel === "NEW_CUSTOMER"
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-emerald-200 bg-emerald-50 text-emerald-950 hover:bg-emerald-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  activePanel === "NEW_CUSTOMER"
                    ? "bg-white/20 text-white"
                    : "bg-white text-emerald-600"
                }`}
              >
                <UserPlus size={18} />
              </div>

              <div>
                <h2 className="text-base font-black">{t.newCustomerNav}</h2>

                <p
                  className={`mt-0.5 text-xs ${
                    activePanel === "NEW_CUSTOMER"
                      ? "text-emerald-50"
                      : "text-emerald-700"
                  }`}
                >
                  {t.newCustomerNavDesc}
                </p>
              </div>
            </div>

            <span
              className={`rounded-lg px-3 py-1.5 text-xs font-black ${
                activePanel === "NEW_CUSTOMER"
                  ? "bg-white text-emerald-700"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {activePanel === "NEW_CUSTOMER" ? t.stateOpen : t.stateCreate}
            </span>
          </button>
        </div>

        {activePanel === "CUSTOMERS" && !selectedSaleCustomer ? (
          <section className="mt-4 rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  {t.registeredCustomers}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {t.registeredCustomersDesc}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 px-4 py-2 font-black text-green-700">
                {t.customerCount(customers.length)}
              </div>
            </div>

            <div className="mt-5">
              <input
                type="search"
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
                placeholder={t.customerSearchPlaceholder}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 focus:bg-white"
              />
            </div>

            {customerError ? (
              <div className="mt-4 rounded-xl bg-red-50 p-4 font-bold text-red-600">
                {customerError}
              </div>
            ) : customerLoading ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-5 font-bold text-slate-500">
                <Loader2 size={19} className="animate-spin" />
                {t.customersLoading}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-5 text-slate-500">
                {t.noCustomersFound}
              </div>
            ) : (
              <div className="mt-4 max-h-[420px] overflow-y-auto rounded-2xl border border-slate-200">
                <div className="divide-y divide-slate-100">
                  {filteredCustomers.map((customer) => (
                    <article
                      key={customer.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openCustomerSale(customer)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openCustomerSale(customer);
                        }
                      }}
                      className="flex cursor-pointer flex-col gap-3 p-4 transition hover:bg-green-50 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="min-w-0 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-slate-950">
                            {customer.name}
                          </p>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">
                            {customer.customerType === "PRIVATE"
                              ? t.typePrivate
                              : t.typeBusiness}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                          {customer.phone ? (
                            <span>
                              <strong className="text-slate-700">
                                {t.phone}
                              </strong>{" "}
                              {customer.phone}
                            </span>
                          ) : null}

                          {customer.email &&
                          !customer.email.endsWith("@paketmarket.local") ? (
                            <span>
                              <strong className="text-slate-700">
                                {t.email}
                              </strong>{" "}
                              {customer.email}
                            </span>
                          ) : null}
                        </div>

                        {customer.address ? (
                          <p className="mt-1 text-sm text-slate-500">
                            <strong className="text-slate-700">{t.address}</strong>{" "}
                            {customer.address}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs font-bold text-amber-600">
                            {t.noAddressOnFile}
                          </p>
                        )}
                      </div>

                      {customer.phone ? (
                        <span className="shrink-0 rounded-xl bg-green-600 px-4 py-2 text-sm font-black text-white">
                          {t.sell}
                        </span>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : null}

        {activePanel === "NEW_CUSTOMER" ? (
          <section className="mt-4 rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                {t.newCustomerTitle}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {t.newCustomerDesc}
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  {t.customerTypeLabel}
                </span>

                <select
                  value={customerForm.customerType}
                  onChange={(event) =>
                    updateCustomerField("customerType", event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-green-500"
                >
                  <option value="BUSINESS">{t.businessOption}</option>
                  <option value="PRIVATE">{t.privateOption}</option>
                </select>
              </label>

              {customerForm.customerType === "BUSINESS" ? (
                <label className="block">
                  <span className="text-sm font-black text-slate-700">
                    {t.companyNameLabel}
                  </span>

                  <input
                    type="text"
                    value={customerForm.companyName}
                    onChange={(event) =>
                      updateCustomerField("companyName", event.target.value)
                    }
                    placeholder={t.companyNamePlaceholder}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                  />
                </label>
              ) : (
                <>
                  <label className="block">
                    <span className="text-sm font-black text-slate-700">
                      {t.firstNameLabel}
                    </span>

                    <input
                      type="text"
                      value={customerForm.firstName}
                      onChange={(event) =>
                        updateCustomerField("firstName", event.target.value)
                      }
                      placeholder={t.firstNamePlaceholder}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-slate-700">
                      {t.lastNameLabel}
                    </span>

                    <input
                      type="text"
                      value={customerForm.lastName}
                      onChange={(event) =>
                        updateCustomerField("lastName", event.target.value)
                      }
                      placeholder={t.lastNamePlaceholder}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                    />
                  </label>
                </>
              )}

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  {t.phoneFieldLabel}
                </span>

                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(event) =>
                    updateCustomerField("phone", event.target.value)
                  }
                  placeholder={t.phonePlaceholder}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  {t.emailFieldLabel}
                </span>

                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(event) =>
                    updateCustomerField("email", event.target.value)
                  }
                  placeholder={t.emailPlaceholder}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">{t.streetLabel}</span>

                <input
                  type="text"
                  value={customerForm.street}
                  onChange={(event) =>
                    updateCustomerField("street", event.target.value)
                  }
                  placeholder={t.streetPlaceholder}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  {t.houseNumberLabel}
                </span>

                <input
                  type="text"
                  value={customerForm.houseNumber}
                  onChange={(event) =>
                    updateCustomerField("houseNumber", event.target.value)
                  }
                  placeholder={t.houseNumberPlaceholder}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  {t.postalCodeLabel}
                </span>

                <input
                  type="text"
                  inputMode="numeric" pattern="[0-9]*"
                  maxLength={5}
                  value={customerForm.postalCode}
                  onChange={(event) =>
                    updateCustomerField(
                      "postalCode",
                      event.target.value.replace(/[^\d]/g, ""),
                    )
                  }
                  placeholder={t.postalCodePlaceholder}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">{t.cityLabel}</span>

                <input
                  type="text"
                  value={customerForm.city}
                  onChange={(event) =>
                    updateCustomerField("city", event.target.value)
                  }
                  placeholder={t.cityPlaceholder}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  clearCustomerForm();
                  setShowCustomerForm(false);
                  setActivePanel("CUSTOMERS");
                  setError("");
                  setSuccess("");
                }}
                disabled={savingCustomer}
                className="rounded-xl bg-slate-100 px-6 py-3 font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
              >
                {t.cancel}
              </button>

              <button
                type="button"
                onClick={createCustomer}
                disabled={savingCustomer}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingCustomer ? (
                  <Loader2 size={19} className="animate-spin" />
                ) : (
                  <UserPlus size={19} />
                )}

                {savingCustomer ? t.saving : t.saveCustomer}
              </button>
            </div>
          </section>
        ) : null}

        {activePanel === "CUSTOMERS" && selectedSaleCustomer ? (
          <section className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-green-50 p-5 sm:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-green-600">
                    {t.saleFromVehicle}
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    {selectedSaleCustomer.name}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                    {selectedSaleCustomer.phone ? (
                      <span>
                        <strong>{t.phone}</strong> {selectedSaleCustomer.phone}
                      </span>
                    ) : null}

                    {selectedSaleCustomer.address ? (
                      <span>
                        <strong>{t.address}</strong> {selectedSaleCustomer.address}
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeCustomerSale}
                  disabled={savingDriverSale}
                  className="rounded-xl bg-white px-5 py-3 font-black text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
                >
                  {t.backToCustomerList}
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              {driverSaleError ? (
                <div className="mb-5 rounded-2xl bg-red-50 p-4 font-bold text-red-600">
                  {driverSaleError}
                </div>
              ) : null}

              {driverStockError ? (
                <div className="rounded-2xl bg-red-50 p-5 font-bold text-red-600">
                  {driverStockError}
                </div>
              ) : driverStockLoading ? (
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-5 font-bold text-slate-500">
                  <Loader2 size={20} className="animate-spin" />
                  {language === "de" ? "Fahrzeugbestand wird geladen..." : "Araç stokları yükleniyor..."}
                </div>
              ) : driverStocks.length === 0 ? (
                <div className="rounded-2xl bg-amber-50 p-5 font-bold text-amber-700">
                  {language === "de" ? "Im Fahrzeug sind keine verkaufbaren Produkte vorhanden." : "Araçta satılabilecek ürün bulunmuyor."}
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white">
                    {/* TELEFON GÖRÜNÜMÜ */}
                    <div className="divide-y divide-slate-200 sm:hidden">
                      {driverStocks.map((stock) => {
                        const enteredQuantity = Number(
                          driverSaleQuantities[stock.productId] || 0,
                        );

                        return (
                          <article
                            key={stock.productId}
                            className="px-3 py-2.5"
                          >
                            <div className="flex min-w-0 items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="break-words text-[13px] font-black leading-4 text-slate-950">
                                  {stock.displayName[language]}
                                </p>

                                <p className="mt-0.5 break-words text-[10px] leading-3 text-slate-500">
                                  {stock.packageInfo || "Paket bilgisi yok"}
                                </p>
                              </div>

                              <div className="min-w-[54px] shrink-0 rounded-lg bg-green-50 px-2 py-1.5 text-center">
                                <p className="text-base font-black leading-none text-green-700">
                                  {stock.currentQuantity}
                                </p>

                                <p className="mt-0.5 text-[8px] font-black uppercase text-green-600">
                                  Araçta
                                </p>
                              </div>
                            </div>

                            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_92px] items-end gap-2">
                              <div className="min-w-0 rounded-lg bg-slate-50 px-2.5 py-1.5">
                                <p className="text-[8px] font-black uppercase tracking-wide text-slate-400">
                                  Birim fiyat
                                </p>

                                <p className="mt-0.5 truncate text-[13px] font-black text-slate-900">
                                  {stock.salePrice.toLocaleString("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </p>
                              </div>

                              <div className="min-w-0">
                                <label
                                  htmlFor={`mobile-sale-${stock.productId}`}
                                  className="mb-0.5 block text-center text-[8px] font-black uppercase leading-3 text-slate-500"
                                >
                                  {language === "de" ? "Verkaufsmenge" : "Satış miktarı"}
                                </label>

                                <input
                                  id={`mobile-sale-${stock.productId}`}
                                  type="text"
                                  inputMode="numeric"
                                  min={0}
                                  max={stock.currentQuantity}
                                  step={1}
                                  value={
                                    driverSaleQuantities[stock.productId] || ""
                                  }
                                  onFocus={(e) => {
                                    const input = e.currentTarget;

                                    requestAnimationFrame(() => {
                                      input?.scrollIntoView({
                                        block: "center",
                                        inline: "nearest",
                                        behavior: "auto",
                                      });
                                    });
                                  }}
                                  onChange={(event) => {
                                    const rawValue = event.target.value;

                                    if (rawValue === "") {
                                      setDriverSaleQuantities((current) => ({
                                        ...current,
                                        [stock.productId]: "",
                                      }));

                                      return;
                                    }

                                    const quantity = Math.max(
                                      0,
                                      Math.min(
                                        stock.currentQuantity,
                                        Math.floor(Number(rawValue) || 0),
                                      ),
                                    );

                                    setDriverSaleQuantities((current) => ({
                                      ...current,
                                      [stock.productId]: String(quantity),
                                    }));
                                  }}
                                  className="block h-9 w-full min-w-0 max-w-full appearance-none rounded-lg border-2 border-slate-200 bg-white px-1 text-center text-sm font-black text-slate-950 outline-none transition focus:border-green-500"
                                />
                              </div>
                            </div>

                            {enteredQuantity > 0 ? (
                              <div className="mt-1.5 flex items-center justify-between rounded-lg bg-green-50 px-2.5 py-1.5">
                                <span className="text-[8px] font-black uppercase text-green-700">
                                  {language === "de" ? "Zeilensumme" : "Satır toplamı"}
                                </span>

                                <strong className="text-[13px] font-black text-green-800">
                                  {(
                                    enteredQuantity * stock.salePrice
                                  ).toLocaleString("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </strong>
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>

                    {/* TABLET VE BİLGİSAYAR GÖRÜNÜMÜ */}
                    <div className="hidden overflow-x-auto sm:block">
                      <div className="min-w-[720px]">
                        <div className="grid grid-cols-[minmax(240px,1fr)_120px_130px_150px] gap-3 bg-slate-50 px-5 py-3 text-xs font-black uppercase text-slate-500">
                          <div>{language === "de" ? "Produkt" : "Ürün"}</div>
                          <div className="text-center">{language === "de" ? "Im Fahrzeug" : "Araçta"}</div>
                          <div className="text-center">{language === "de" ? "Stückpreis" : "Birim fiyat"}</div>
                          <div className="text-center">{language === "de" ? "Verkaufsmenge" : "Satış miktarı"}</div>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {driverStocks.map((stock) => {
                            const enteredQuantity = Number(
                              driverSaleQuantities[stock.productId] || 0,
                            );

                            return (
                              <article
                                key={stock.productId}
                                className="grid grid-cols-[minmax(240px,1fr)_120px_130px_150px] items-center gap-3 px-5 py-4"
                              >
                                <div className="min-w-0">
                                  <p className="break-words font-black text-slate-950">
                                    {stock.displayName[language]}
                                  </p>

                                  <p className="mt-1 break-words text-xs text-slate-500">
                                    {stock.packageInfo || "Paket bilgisi yok"}
                                  </p>
                                </div>

                                <div className="text-center">
                                  <p className="text-lg font-black text-green-700">
                                    {stock.currentQuantity}
                                  </p>

                                  <p className="text-[10px] font-bold text-slate-400">
                                    {getDriverStockUnitLabel(stock.stockUnit, language)}
                                  </p>
                                </div>

                                <div className="text-center font-black text-slate-800">
                                  {stock.salePrice.toLocaleString("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </div>

                                <div>
                                  <input
                                    type="number"
                                    min={0}
                                    max={stock.currentQuantity}
                                    step={1}
                                    value={
                                      driverSaleQuantities[stock.productId] ||
                                      ""
                                    }
                                    onChange={(event) => {
                                      const rawValue = event.target.value;

                                      if (rawValue === "") {
                                        setDriverSaleQuantities((current) => ({
                                          ...current,
                                          [stock.productId]: "",
                                        }));

                                        return;
                                      }

                                      const quantity = Math.max(
                                        0,
                                        Math.min(
                                          stock.currentQuantity,
                                          Math.floor(Number(rawValue) || 0),
                                        ),
                                      );

                                      setDriverSaleQuantities((current) => ({
                                        ...current,
                                        [stock.productId]: String(quantity),
                                      }));
                                    }}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-black outline-none transition focus:border-green-500"
                                  />

                                  {enteredQuantity > 0 ? (
                                    <p className="mt-1 text-center text-[10px] font-bold text-green-600">
                                      {(
                                        enteredQuantity * stock.salePrice
                                      ).toLocaleString("de-DE", {
                                        style: "currency",
                                        currency: "EUR",
                                      })}
                                    </p>
                                  ) : null}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-base font-black text-slate-950">
                              {language === "de" ? "Zahlungsart" : "Ödeme Şekli"}
                            </p>

                            <p className="mt-1 text-xs font-bold text-slate-500">
                              {language === "de" ? "Wählen Sie die Zahlungsart des Kunden." : "Müşterinin ödeme türünü seçin."}
                            </p>
                          </div>

                          <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                            Zorunlu
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {[
                            {
                              value: "CASH",
                              label: "Nakit",
                              description: "Para şoför tarafından alındı",
                              icon: "€",
                              active:
                                "border-amber-500 bg-amber-500 text-white ring-4 ring-amber-100",
                              passive:
                                "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100",
                            },
                            {
                              value: "CARD",
                              label: "Kart",
                              description: "Kart ile ödeme yapıldı",
                              icon: "▣",
                              active:
                                "border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100",
                              passive:
                                "border-blue-200 bg-blue-50 text-blue-950 hover:bg-blue-100",
                            },
                            {
                              value: "OPEN",
                              label: "Açık Hesap",
                              description: "Ödeme daha sonra alınacak",
                              icon: "↗",
                              active:
                                "border-rose-600 bg-rose-600 text-white ring-4 ring-rose-100",
                              passive:
                                "border-rose-200 bg-rose-50 text-rose-950 hover:bg-rose-100",
                            },
                          ].map((method) => {
                            const selected =
                              driverSalePaymentMethod === method.value;

                            return (
                              <button
                                key={method.value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() =>
                                  setDriverSalePaymentMethod(
                                    method.value as "CASH" | "CARD" | "OPEN",
                                  )
                                }
                                className={`relative flex min-h-[100px] w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left shadow-sm transition active:scale-[0.98] ${
                                  selected ? method.active : method.passive
                                }`}
                              >
                                <span
                                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-black ${
                                    selected
                                      ? "bg-white/20 text-white"
                                      : "bg-white shadow-sm"
                                  }`}
                                >
                                  {method.icon}
                                </span>

                                <span className="min-w-0">
                                  <span className="block text-lg font-black">
                                    {method.label}
                                  </span>

                                  <span
                                    className={`mt-1 block text-xs font-bold leading-4 ${
                                      selected ? "text-white/90" : "opacity-70"
                                    }`}
                                  >
                                    {method.description}
                                  </span>
                                </span>

                                {selected ? (
                                  <span className="absolute right-3 top-3 rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase text-slate-900">
                                    Seçildi
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>

                        <div
                          className={`mt-4 rounded-xl px-4 py-3 text-sm font-black ${
                            driverSalePaymentMethod === "CASH"
                              ? "bg-amber-100 text-amber-900"
                              : driverSalePaymentMethod === "CARD"
                                ? "bg-blue-100 text-blue-900"
                                : "bg-rose-100 text-rose-900"
                          }`}
                        >
                          Seçilen ödeme:{" "}
                          {driverSalePaymentMethod === "CASH"
                            ? "Nakit"
                            : driverSalePaymentMethod === "CARD"
                              ? "Kart"
                              : "Açık Hesap"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                        <div>
                          <p className="font-black text-amber-950">
                            {language === "de" ? "Vom Kunden erhaltenes Pfand" : "Müşteriden Alınan Pfand"}
                          </p>

                          <p className="mt-1 text-xs text-amber-700">
                            {language === "de" ? "Geben Sie die vom Kunden zurückgegebenen leeren Kisten oder Flaschen ein." : "Müşterinin verdiği boş kasa veya şişeleri girin."}
                            {language === "de" ? "Der Pfandbetrag wird vom Verkaufsbetrag abgezogen." : "Pfand tutarı satış hesabından düşer."}
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                          {driverPfandTypes.map((pfandType) => (
                            <label
                              key={pfandType.key}
                              className="min-w-0 rounded-xl border border-amber-100 bg-white p-3 shadow-sm"
                            >
                              <span className="text-xs font-black text-slate-700">
                                {pfandType.label}
                              </span>

                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={
                                  driverSalePfandValues[pfandType.key] || ""
                                }
                                onChange={(event) => {
                                  const rawValue = event.target.value;

                                  if (rawValue === "") {
                                    setDriverSalePfandValues((current) => ({
                                      ...current,
                                      [pfandType.key]: "",
                                    }));

                                    return;
                                  }

                                  const quantity = Math.max(
                                    0,
                                    Math.floor(Number(rawValue) || 0),
                                  );

                                  setDriverSalePfandValues((current) => ({
                                    ...current,
                                    [pfandType.key]: String(quantity),
                                  }));
                                }}
                                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-black outline-none focus:border-amber-500"
                              />
                            </label>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-100 px-4 py-3">
                          <span className="text-sm font-black text-amber-900">
                            {language === "de" ? "Pfand-Rückgabe" : "Pfand İadesi"}
                          </span>

                          <strong className="text-xl text-amber-950">
                            -
                            {getDriverSalePfandReturnTotal().toLocaleString(
                              "de-DE",
                              {
                                style: "currency",
                                currency: "EUR",
                              },
                            )}
                          </strong>
                        </div>
                      </div>

                      <label className="block">
                        <span className="text-sm font-black text-slate-700">
                          {language === "de" ? "Verkaufsnotiz" : "Satış notu"}
                        </span>

                        <textarea
                          rows={3}
                          value={driverSaleNote}
                          onChange={(event) =>
                            setDriverSaleNote(event.target.value)
                          }
                          placeholder={language === "de" ? "Optionale Verkaufsnotiz..." : "İsteğe bağlı satış notu..."}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-500"
                        />
                      </label>
                    </div>

                    <div className="min-w-0 rounded-2xl bg-slate-950 p-5 text-white shadow-xl lg:sticky lg:top-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        {language === "de" ? "Verkaufssumme" : "Satış toplamı"}
                      </p>

                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">{language === "de" ? "Produktsumme" : "Ürün toplamı"}</span>

                          <strong>
                            {getDriverSaleSubtotal().toLocaleString("de-DE", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-amber-300">
                            {language === "de" ? "Vom Kunden zurückgegebenes Pfand" : "Müşterinin verdiği Pfand"}
                          </span>

                          <strong className="text-amber-300">
                            -
                            {getDriverSalePfandReturnTotal().toLocaleString(
                              "de-DE",
                              {
                                style: "currency",
                                currency: "EUR",
                              },
                            )}
                          </strong>
                        </div>

                        <div className="border-t border-white/20 pt-3">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            {language === "de" ? "Vom Kunden zu erhalten" : "Müşteriden Alınacak"}
                          </p>

                          <p className="mt-1 text-3xl font-black">
                            {getDriverSalePayableTotal().toLocaleString(
                              "de-DE",
                              {
                                style: "currency",
                                currency: "EUR",
                              },
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={submitDriverSale}
                        disabled={
                          savingDriverSale ||
                          getSelectedDriverSaleItems().length === 0
                        }
                        className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 text-base font-black text-white shadow-lg transition hover:bg-green-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingDriverSale ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : null}

                        {savingDriverSale
                          ? "Satış Kaydediliyor..."
                          : "Satışı Tamamla"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        ) : null}

        {activePanel === "STOCK" ? (
          <section className="mt-6 overflow-hidden rounded-[28px] bg-white shadow-sm">
            <div className="border-t border-slate-100 p-4 sm:p-6">
              {!driverStockLoading && !driverStockError ? (
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-violet-700">
                      Bu Tur Yüklenen Mal Değeri
                    </p>

                    <p className="mt-2 text-3xl font-black text-violet-950">
                      {driverStockSummary.currentTripLoadedValue.toLocaleString(
                        "de-DE",
                        {
                          style: "currency",
                          currency: "EUR",
                        },
                      )}
                    </p>

                    <p className="mt-1 text-xs font-bold text-violet-700">
                      {language === "de" ? "Bleibt bestehen, bis das Fahrzeug vollständig entladen ist" : "Araç tamamen boşaltılana kadar sabit kalır"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-orange-700">
                      Araçta Kalan Mal Değeri
                    </p>

                    <p className="mt-2 text-3xl font-black text-orange-950">
                      {driverStocks
                        .reduce(
                          (total, stock) =>
                            total + stock.currentQuantity * stock.salePrice,
                          0,
                        )
                        .toLocaleString("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        })}
                    </p>

                    <p className="mt-1 text-xs font-bold text-orange-700">
                      {language === "de" ? "Verkaufswert der aktuell im Fahrzeug befindlichen Produkte" : "Araçta şu anda bulunan ürünlerin satış değeri"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                      {language === "de" ? "Wert der verkauften Ware" : "Satılan Mal Değeri"}
                    </p>

                    <p className="mt-2 text-3xl font-black text-blue-950">
                      {driverStocks
                        .reduce(
                          (total, stock) =>
                            total + stock.soldQuantity * stock.salePrice,
                          0,
                        )
                        .toLocaleString("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        })}
                    </p>

                    <p className="mt-1 text-xs font-bold text-blue-700">
                      {language === "de" ? "Verkaufswert der vom Fahrer verkauften Produkte" : "Şoförün sattığı ürünlerin satış değeri"}
                    </p>
                  </div>
                </div>
              ) : null}

              {driverStockError ? (
                <div className="rounded-2xl bg-red-50 p-4 font-bold text-red-600">
                  {driverStockError}
                </div>
              ) : driverStockLoading ? (
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-5 font-bold text-slate-500">
                  <Loader2 size={19} className="animate-spin" />
                  {language === "de" ? "Fahrzeugbestand wird geladen..." : "Araç stokları yükleniyor..."}
                </div>
              ) : driverStocks.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-5 text-slate-500">
                  Araç stokunda veya stok hareketlerinde henüz ürün bulunmuyor.
                </div>
              ) : (
                <div>
                  {/* TELEFON GÖRÜNÜMÜ */}
                  <div className="space-y-3 sm:hidden">
                    {driverStocks.map((stock) => (
                      <article
                        key={stock.productId}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        <div className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-black leading-5 text-slate-950">
                              {stock.displayName[language]}
                            </p>

                            <p className="mt-0.5 break-words text-[10px] leading-4 text-slate-500">
                              {stock.packageInfo || "Paket bilgisi yok"}
                            </p>
                          </div>

                          <div className="shrink-0 rounded-xl bg-emerald-100 px-3 py-2 text-center">
                            <p className="text-xl font-black leading-none text-emerald-800">
                              {stock.currentQuantity}
                            </p>

                            <p className="mt-1 text-[8px] font-black uppercase text-emerald-700">
                              Araçta
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-3">
                          <div className="min-w-0 rounded-xl bg-orange-50 p-3">
                            <p className="text-[9px] font-black uppercase tracking-wide text-orange-600">
                              Yüklenen
                            </p>

                            <p className="mt-1 text-lg font-black leading-none text-orange-700">
                              {stock.loadedQuantity}
                            </p>

                            <p className="mt-1 text-[9px] font-bold text-orange-600">
                              {getDriverStockUnitLabel(stock.stockUnit, language)}
                            </p>
                          </div>

                          <div className="min-w-0 rounded-xl bg-orange-50 p-3">
                            <p className="text-[9px] font-black uppercase tracking-wide text-orange-600">
                              {language === "de" ? "Ausgangswert" : "Giden değeri"}
                            </p>

                            <p className="mt-1 truncate text-sm font-black text-orange-800">
                              {(
                                stock.loadedQuantity * stock.salePrice
                              ).toLocaleString("de-DE", {
                                style: "currency",
                                currency: "EUR",
                              })}
                            </p>
                          </div>

                          <div className="min-w-0 rounded-xl bg-blue-50 p-3">
                            <p className="text-[9px] font-black uppercase tracking-wide text-blue-600">
                              {language === "de" ? "Verkauft" : "Satılan"}
                            </p>

                            <p className="mt-1 text-lg font-black leading-none text-blue-700">
                              {stock.soldQuantity}
                            </p>

                            <p className="mt-1 text-[9px] font-bold text-blue-600">
                              {getDriverStockUnitLabel(stock.stockUnit, language)}
                            </p>
                          </div>

                          <div className="min-w-0 rounded-xl bg-green-50 p-3">
                            <p className="text-[9px] font-black uppercase tracking-wide text-green-600">
                              {language === "de" ? "Restwert" : "Kalan değeri"}
                            </p>

                            <p className="mt-1 truncate text-sm font-black text-green-800">
                              {(
                                stock.currentQuantity * stock.salePrice
                              ).toLocaleString("de-DE", {
                                style: "currency",
                                currency: "EUR",
                              })}
                            </p>

                            <p className="mt-1 text-[9px] font-bold text-green-600">
                              {stock.currentQuantity}{" "}
                              {getDriverStockUnitLabel(stock.stockUnit, language)} {t.remainingSuffix}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* TABLET VE BİLGİSAYAR GÖRÜNÜMÜ */}
                  <div className="hidden overflow-x-auto sm:block">
                    <div className="min-w-[760px]">
                      <div className="grid grid-cols-[minmax(210px,1fr)_90px_120px_90px_120px_90px] gap-3 border-b border-slate-200 px-4 pb-3 text-xs font-black uppercase text-slate-400">
                        <div>{language === "de" ? "Produkt" : "Ürün"}</div>
                        <div className="text-center">{language === "de" ? "Geladen" : "Yüklenen"}</div>
                        <div className="text-center">{language === "de" ? "Ausgangswert" : "Giden Değeri"}</div>
                        <div className="text-center">{language === "de" ? "Verkauft" : "Satılan"}</div>
                        <div className="text-center">{language === "de" ? "Restwert" : "Kalan Değeri"}</div>
                        <div className="text-center">{language === "de" ? "Aktuell im Fahrzeug" : "Araçta Güncel"}</div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {driverStocks.map((stock) => (
                          <article
                            key={stock.productId}
                            className="grid grid-cols-[minmax(210px,1fr)_90px_120px_90px_120px_90px] items-center gap-3 px-4 py-4"
                          >
                            <div className="min-w-0">
                              <p className="break-words font-black text-slate-950">
                                {stock.displayName[language]}
                              </p>

                              <p className="mt-1 break-words text-xs text-slate-500">
                                {stock.packageInfo || "Paket bilgisi yok"}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-lg font-black text-orange-600">
                                {stock.loadedQuantity}
                              </p>

                              <p className="text-[10px] font-bold text-slate-400">
                                {getDriverStockUnitLabel(stock.stockUnit, language)}
                              </p>
                            </div>

                            <div className="rounded-xl bg-orange-50 px-2 py-2 text-center">
                              <p className="text-sm font-black text-orange-700">
                                {(
                                  stock.loadedQuantity * stock.salePrice
                                ).toLocaleString("de-DE", {
                                  style: "currency",
                                  currency: "EUR",
                                })}
                              </p>

                              <p className="mt-1 text-[9px] font-bold text-orange-600">
                                Giden
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-lg font-black text-blue-600">
                                {stock.soldQuantity}
                              </p>

                              <p className="text-[10px] font-bold text-slate-400">
                                {getDriverStockUnitLabel(stock.stockUnit, language)}
                              </p>
                            </div>

                            <div className="rounded-xl bg-green-50 px-2 py-2 text-center">
                              <p className="text-sm font-black text-green-700">
                                {(
                                  stock.currentQuantity * stock.salePrice
                                ).toLocaleString("de-DE", {
                                  style: "currency",
                                  currency: "EUR",
                                })}
                              </p>

                              <p className="mt-1 text-[9px] font-bold text-green-600">
                                {stock.currentQuantity}{" "}
                                {getDriverStockUnitLabel(stock.stockUnit, language)} {t.remainingSuffix}
                              </p>
                            </div>

                            <div className="rounded-xl bg-emerald-50 px-2 py-2 text-center">
                              <p className="text-lg font-black text-emerald-700">
                                {stock.currentQuantity}
                              </p>

                              <p className="text-[10px] font-bold text-emerald-600">
                                {getDriverStockUnitLabel(stock.stockUnit, language)}
                              </p>

                              <p className="mt-1 text-[9px] font-bold text-emerald-600">
                                Araçta mevcut
                              </p>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activePanel === "ORDERS" ? (
          <section id="gelen-siparisler" className="mt-8">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <PackageCheck className="text-orange-500" />

                <div>
                  <h2 className="text-2xl font-black text-slate-950">
                    {showDelivered ? "Teslim Edilenler" : "Aktif Teslimatlar"}
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {showDelivered
                      ? "Teslim ettiğiniz siparişleri görüntülüyorsunuz."
                      : "Henüz teslim etmediğiniz siparişleri görüntülüyorsunuz."}
                  </p>
                </div>
              </div>

              {showDelivered && (
                <input
                  type="date"
                  value={historyDate}
                  onChange={(e)=>setHistoryDate(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-3 font-bold"
                />
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDelivered((current) => !current)}
                  className={`rounded-xl px-5 py-3 font-black transition ${
                    showDelivered
                      ? "bg-slate-950 text-white hover:bg-slate-800"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {showDelivered
                    ? "Aktif Teslimatları Göster"
                    : "Teslim Edilenler"}
                </button>

                {showDelivered && (
                  <button
                    type="button"
                    onClick={() => window.open("/driver/end-of-day","_blank","width=1200,height=900")}
                    className="rounded-xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-700"
                  >
                    Gün Sonu Kapat
                  </button>
                )}
              </div>
            </div>

            {showDelivered ? (
              <div className="mb-5">
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e)=>setHistorySearch(e.target.value)}
                  placeholder={language === "de" ? "Kunde suchen..." : "Müşteri ara..."}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-orange-500"
                />
              </div>
            ) : null}

            {showDelivered ? (
              <div className="mb-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Teslim Edilen Sipariş
                  </p>

                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {deliveredOrderCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-green-50 p-5 shadow">
                  <p className="text-xs font-bold uppercase text-green-700">
                    Toplam Satış
                  </p>

                  <p className="mt-2 text-3xl font-black text-green-700">
                    {deliveredOrderTotal.toLocaleString("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </p>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl bg-red-50 p-5 font-bold text-red-600">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mb-5 rounded-2xl bg-green-50 p-5 font-bold text-green-700">
                {success}
              </div>
            ) : null}

            



{loading ? (


              <div className="flex items-center gap-3 rounded-[28px] bg-white p-7 font-bold text-slate-500">
                <Loader2 className="animate-spin" />
                Teslimatlar yükleniyor...
              </div>
            ) : orders.filter((order) =>
                showDelivered
                  ? order.status === "DELIVERED"
                  : order.status !== "DELIVERED",
              ).length === 0 ? (
              <div className="rounded-[28px] bg-white p-7 text-slate-500">
                {showDelivered
                  ? "Henüz teslim edilmiş sipariş bulunmuyor."
                  : "Size atanmış aktif sipariş bulunmuyor."}
              </div>
            ) : (
              <div className="space-y-4">
                {orders
                  .filter((order) => {
                    if (showDelivered) {
                      if (order.status !== "DELIVERED") return false;

                      const customerName =
                        (
                          order.user.companyName ||
                          `${order.user.firstName || ""} ${order.user.lastName || ""}`
                        ).toLowerCase();

                      if (!customerName.includes(historySearch.toLowerCase()))
                      return false;

                    if (historyDate) {
                      const d = new Date(order.createdAt)
                        .toISOString()
                        .slice(0,10);

                      return d === historyDate;
                    }

                    return true;
                  }

                  return order.status !== "DELIVERED";
                  })
                  .map((order) => {
                    const expanded = expandedOrderId === order.id;

                    const customerName =
                      order.user.companyName ||
                      `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim();

                    return (
                      <article
                        key={order.id}
                        className="overflow-hidden rounded-[28px] bg-white shadow-sm"
                      >
                        <div className="p-6">
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                            <div className="flex-1">
                              <p className="text-sm font-black text-orange-500">
                                {order.orderNumber}
                              </p>

                              <h3 className="mt-1 text-xl font-black text-slate-950">
                                {customerName}
                              </h3>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {new Date(order.createdAt).toLocaleString(
                                  "de-DE",
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase text-slate-400">
                                Durum
                              </p>

                              <p className="mt-1 font-black text-slate-950">
                                {statusLabels[order.status][language]}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase text-slate-400">
                                Toplam
                              </p>

                              <p className="mt-1 font-black text-slate-950">
                                {getDriverOrderTotal(order).toFixed(2)} €
                              </p>
                            </div>

                            <div className="min-w-44">
                              <p className="text-xs font-bold uppercase text-slate-400">
                                Ödeme
                              </p>

                              {order.driverPaymentReportedAt ? (
                                <>
                                  <p className="mt-1 font-black text-green-700">
                                    Admin Onayladı
                                  </p>

                                  <p className="mt-1 text-[10px] font-bold text-green-600">
                                    {language === "de" ? "Geld wurde in die Kasse gebucht" : "Para kasaya işlendi"}
                                  </p>
                                </>
                              ) : order.paymentStatus === "PAID" ? (
                                <>
                                  <p className="mt-1 font-black text-amber-600">
                                    Para Alındı
                                  </p>

                                  <p className="mt-1 text-[10px] font-bold text-amber-700">
                                    {language === "de" ? "Wartet auf Kassenbestätigung durch Admin" : "Admin kasa onayı bekleniyor"}
                                  </p>

                                  {order.driverPaymentReportedAmount !==
                                  null ? (
                                    <div className="mt-2 space-y-1 rounded-xl bg-amber-50 p-3">
                                      <div className="flex items-center justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase text-amber-700">
                                          Bildirilen tutar
                                        </span>

                                        <strong className="text-sm text-amber-900">
                                          {order.driverPaymentReportedAmount.toLocaleString(
                                            "de-DE",
                                            {
                                              style: "currency",
                                              currency: "EUR",
                                            },
                                          )}
                                        </strong>
                                      </div>

                                      <div className="flex items-center justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase text-red-600">
                                          {language === "de" ? "Offen in der Bestellung" : "Siparişte açık"}
                                        </span>

                                        <strong className="text-sm text-red-700">
                                          {Number(
                                            order.openPaymentAmount ??
                                              Math.max(
                                                0,
                                                Number(order.totalAmount || 0) -
                                                  Number(
                                                    order.approvedPaymentAmount ||
                                                      0,
                                                  ),
                                              ),
                                          ).toLocaleString("de-DE", {
                                            style: "currency",
                                            currency: "EUR",
                                          })}
                                        </strong>
                                      </div>

                                      {order.pendingPaymentAmount > 0.009 ? (
                                        <p className="pt-1 text-[10px] font-bold text-amber-700">
                                          {language === "de"
                                            ? "Die gemeldete Zahlung wird nach Bestätigung durch den Admin vom offenen Betrag abgezogen."
                                            : "Bildirilen ödeme admin tarafından onaylandıktan sonra açık tutardan düşecektir."}
                                        </p>
                                      ) : null}
                                    </div>
                                  ) : null}

                                  <button
                                    type="button"
                                    disabled={updatingOrderId === order.id}
                                    onClick={() =>
                                      updateDeliveryStatus(
                                        order,
                                        "OPEN_PAYMENT",
                                      )
                                    }
                                    className="mt-2 w-full rounded-xl bg-slate-700 px-3 py-2 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
                                  >
                                    {updatingOrderId === order.id
                                      ? "Kaydediliyor..."
                                      : "Para Bildirimini Geri Al"}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <p className="mt-1 font-black text-red-600">
                                    Ödeme Açık
                                  </p>

                                  <div className="mt-2 rounded-xl bg-red-50 p-3">
                                    <p className="text-[10px] font-black uppercase text-red-600">
                                      {language === "de" ? "Verbleibender offener Betrag" : "Kalan açık tutar"}
                                    </p>

                                    <p className="mt-1 text-xl font-black text-red-700">
                                      {Number(
                                        order.openPaymentAmount ??
                                          Math.max(
                                            0,
                                            Number(order.totalAmount || 0) -
                                              Number(
                                                order.approvedPaymentAmount ||
                                                  0,
                                              ),
                                          ),
                                      ).toLocaleString("de-DE", {
                                        style: "currency",
                                        currency: "EUR",
                                      })}
                                    </p>

                                    {order.approvedPaymentAmount > 0.009 ? (
                                      <p className="mt-1 text-[10px] font-bold text-green-700">
                                        Daha önce onaylanan:{" "}
                                        {order.approvedPaymentAmount.toLocaleString(
                                          "de-DE",
                                          {
                                            style: "currency",
                                            currency: "EUR",
                                          },
                                        )}
                                      </p>
                                    ) : (
                                      <p className="mt-1 text-[10px] font-bold text-slate-500">
                                        {language === "de" ? "Noch keine bestätigte Zahlung vorhanden" : "Henüz onaylanmış ödeme bulunmuyor"}
                                      </p>
                                    )}
                                  </div>

                                  <label className="mt-2 block">
                                    <span className="text-[10px] font-black uppercase text-slate-500">
                                      {language === "de" ? "Vom Kunden erhalten" : "Müşteriden alınan"}
                                    </span>

                                    <div className="relative mt-1">
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0.01"
                                        max={getDriverOpenPaymentAmount(order)}
                                        step="0.01"
                                        value={paymentAmounts[order.id] || ""}
                                        onChange={(event) =>
                                          setPaymentAmounts((current) => ({
                                            ...current,
                                            [order.id]: event.target.value,
                                          }))
                                        }
                                        placeholder={language === "de" ? "0,00" : "0,00"}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-black text-slate-950 outline-none focus:border-green-500"
                                      />

                                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">
                                        €
                                      </span>
                                    </div>
                                  </label>

                                  <div className="mt-2 flex gap-2">
                                    {(["CASH", "CARD"] as const).map(
                                      (method) => {
                                        const selected =
                                          (paymentMethods[order.id] ||
                                            "CASH") === method;

                                        return (
                                          <button
                                            key={method}
                                            type="button"
                                            onClick={() =>
                                              setPaymentMethods((current) => ({
                                                ...current,
                                                [order.id]: method,
                                              }))
                                            }
                                            className={`flex-1 rounded-xl border px-3 py-2 text-xs font-black transition ${
                                              selected
                                                ? "border-green-600 bg-green-600 text-white"
                                                : "border-slate-200 bg-white text-slate-500"
                                            }`}
                                          >
                                            {method === "CASH"
                                              ? "Nakit"
                                              : "Kart"}
                                          </button>
                                        );
                                      },
                                    )}
                                  </div>

                                  {Number(paymentAmounts[order.id] || 0) > 0 ? (
                                    <div className="mt-2 rounded-xl bg-red-50 px-3 py-2">
                                      <p className="text-[10px] font-black uppercase text-red-600">
                                        {language === "de" ? "Bleibt offen" : "Açık kalacak"}
                                      </p>

                                      <p className="mt-0.5 text-sm font-black text-red-700">
                                        {Math.max(
                                          0,
                                          getDriverOpenPaymentAmount(order) -
                                            Number(
                                              paymentAmounts[order.id] || 0,
                                            ),
                                        ).toLocaleString("de-DE", {
                                          style: "currency",
                                          currency: "EUR",
                                        })}
                                      </p>
                                    </div>
                                  ) : null}

                                  <button
                                    type="button"
                                    disabled={
                                      updatingOrderId === order.id ||
                                      !Number.isFinite(
                                        Number(paymentAmounts[order.id]),
                                      ) ||
                                      Number(paymentAmounts[order.id]) <= 0 ||
                                      Number(paymentAmounts[order.id]) >
                                        getDriverOpenPaymentAmount(order)
                                    }
                                    onClick={() =>
                                      updateDeliveryStatus(
                                        order,
                                        "PAID",
                                        Number(paymentAmounts[order.id]),
                                      )
                                    }
                                    className="mt-2 w-full rounded-xl bg-green-600 px-3 py-2 text-sm font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    {updatingOrderId === order.id
                                      ? "Bildiriliyor..."
                                      : "Ödemeyi Bildir"}
                                  </button>
                                </>
                              )}
                            </div>

                            {order.status !== "DELIVERED" ? (
                              <div className="min-w-48">
                                {order.status === "OUT_FOR_DELIVERY" ? (
                                  <button
                                    type="button"
                                    disabled={updatingOrderId === order.id}
                                    onClick={() =>
                                      updateDeliveryStatus(order, "DELIVERED")
                                    }
                                    className="w-full rounded-xl bg-green-600 px-4 py-3 font-black text-white transition hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {updatingOrderId === order.id
                                      ? "Kaydediliyor..."
                                      : "Teslim Ettim"}
                                  </button>
                                ) : ["READY", "PREPARING", "CONFIRMED"].includes(
                                    order.status,
                                  ) ? (
                                  <button
                                    type="button"
                                    disabled={updatingOrderId === order.id}
                                    onClick={() =>
                                      updateDeliveryStatus(
                                        order,
                                        "OUT_FOR_DELIVERY",
                                      )
                                    }
                                    className="w-full rounded-xl bg-orange-500 px-4 py-3 font-black text-white transition hover:bg-orange-600 disabled:opacity-50"
                                  >
                                    {updatingOrderId === order.id
                                      ? "Kaydediliyor..."
                                      : "Teslimata Çıktım"}
                                  </button>
                                ) : (
                                  <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-500">
                                    {language === "de"
                                      ? "Wartet auf Bestätigung"
                                      : "Onay bekleniyor"}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="rounded-xl bg-green-50 px-4 py-3 font-black text-green-700">
                                Teslim Edildi
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  `/driver/receipt/${order.id}?lang=${language}`,
                                  "_blank",
                                  "width=420,height=900"
                                )
                              }
                              className="flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-black text-white transition hover:bg-slate-700"
                            >
                              <Printer size={17} />
                              {language === "de" ? "Beleg drucken" : "Fiş Yazdır"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOrderId(expanded ? null : order.id)
                              }
                              className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
                            >
                              {expanded ? (
                                <ChevronUp size={20} />
                              ) : (
                                <ChevronDown size={20} />
                              )}
                            </button>
                          </div>

                          <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                              <div className="flex items-center gap-2 font-bold text-slate-950">
                                <MapPin size={18} className="text-orange-500" />
                                Teslimat Adresi
                              </div>

                              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                                {order.deliveryAddress}
                              </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                              <div className="flex items-center gap-2 font-bold text-slate-950">
                                <Phone size={18} className="text-orange-500" />
                                {language === "de" ? "Kunde" : "Müşteri"}
                              </div>

                              <p className="mt-2 text-sm text-slate-600">
                                {customerName}
                              </p>

                              <p className="text-sm text-slate-600">
                                {order.user.phone || "Telefon yok"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {expanded ? (
                          <div className="border-t border-slate-200 p-6">
                            <h4 className="text-sm font-black text-slate-950">
                              {language === "de" ? "Bestellte Produkte" : "Sipariş Ürünleri"}
                            </h4>

                            <div className="mt-3 space-y-2">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                                >
                                  <div>
                                    <p className="font-bold text-slate-950">
                                      {item.name}
                                    </p>

                                    <p className="text-sm text-slate-500">
                                      Adet: {item.quantity}
                                    </p>
                                  </div>

                                  <p className="text-sm font-black text-slate-950">
                                    {(item.price * item.quantity).toFixed(2)} €
                                  </p>
                                </div>
                              ))}
                            </div>

                            {order.customerNote ? (
                              <div className="mt-5 rounded-2xl bg-amber-50 p-4">
                                <p className="text-sm font-black text-amber-900">
                                  {language === "de" ? "Kundennotiz" : "Müşteri Notu"}
                                </p>

                                <p className="mt-1 text-sm text-amber-800">
                                  {order.customerNote}
                                </p>
                              </div>
                            ) : null}

                            {order.pfandReturns.length > 0 ? (
                              <div className="mt-4 w-full max-w-[520px] rounded-xl border border-slate-200 bg-white p-2.5">
                                <div className="mb-2">
                                  <h4 className="text-sm font-black text-slate-950">
                                    {language === "de" ? "Pfand-Rückgabe" : "Pfand İadesi"}
                                  </h4>

                                  <p className="text-[11px] text-slate-500">
                                    {language === "de" ? "Prüfen Sie die vom Kunden gemeldete Menge" : "Müşterinin bildirdiği miktarı kontrol edin"}
                                    ve gerçek alınan miktarı girin.
                                  </p>
                                </div>

                                <div className="overflow-hidden rounded-lg border border-slate-200">
                                  <div className="grid grid-cols-[1fr_105px_60px] items-center gap-1 bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">
                                    <div>{language === "de" ? "Pfandart" : "Pfand Türü"}</div>

                                    <div className="text-center">
                                      Şoförün Aldığı
                                    </div>

                                    <div className="text-right">{language === "de" ? "Betrag" : "Tutar"}</div>
                                  </div>

                                  {order.pfandReturns[0].items.map((item) => {
                                    const currentQuantity =
                                      getPfandQuantity(item);

                                    return (
                                      <div
                                        key={item.id}
                                        className="grid grid-cols-[1fr_105px_60px] items-center gap-1 border-t border-slate-200 px-2 py-1"
                                      >
                                        <div className="min-w-0">
                                          <p className="truncate text-[11px] font-bold text-slate-950">
                                            {item.name}
                                          </p>

                                          <p className="text-[9px] text-slate-400">
                                            Birim: {item.unitAmount.toFixed(2)}{" "}
                                            €
                                          </p>
                                        </div>

                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            type="button"
                                            disabled={
                                              order.status === "DELIVERED" ||
                                              updatingOrderId === order.id
                                            }
                                            onClick={() =>
                                              changePfandQuantity(item, -1)
                                            }
                                            className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 text-[10px] font-black text-slate-900 hover:bg-slate-300 disabled:opacity-40"
                                          >
                                            -
                                          </button>

                                          <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={currentQuantity}
                                            disabled={
                                              order.status === "DELIVERED" ||
                                              updatingOrderId === order.id
                                            }
                                            onChange={(event) =>
                                              setPfandQuantity(
                                                item,
                                                Number(event.target.value),
                                              )
                                            }
                                            className="h-5 w-9 rounded border border-slate-200 bg-white text-center text-[10px] font-black text-slate-950 outline-none focus:border-orange-500 disabled:bg-slate-100"
                                          />

                                          <button
                                            type="button"
                                            disabled={
                                              order.status === "DELIVERED" ||
                                              updatingOrderId === order.id
                                            }
                                            onClick={() =>
                                              changePfandQuantity(item, 1)
                                            }
                                            className="flex h-5 w-5 items-center justify-center rounded bg-orange-500 text-[10px] font-black text-white hover:bg-orange-600 disabled:opacity-40"
                                          >
                                            +
                                          </button>
                                        </div>

                                        <div className="text-right text-[11px] font-black text-slate-950">
                                          {(
                                            currentQuantity * item.unitAmount
                                          ).toFixed(2)}{" "}
                                          €
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="mt-2 flex items-center justify-between rounded-lg bg-orange-50 px-2 py-1">
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <p className="text-[9px] font-bold text-orange-800">
                                        {language === "de" ? "Pfand-Rückgabe" : "Pfand İadesi"}
                                      </p>

                                      <p className="text-xs font-black text-orange-950">
                                        {order.pfandReturns[0].items
                                          .reduce(
                                            (total, item) =>
                                              total +
                                              getPfandQuantity(item) *
                                                item.unitAmount,
                                            0,
                                          )
                                          .toFixed(2)}{" "}
                                        €
                                      </p>
                                    </div>

                                    <div className="border-l border-orange-200 pl-4">
                                      <p className="text-[9px] font-bold text-orange-800">
                                        {language === "de" ? "Vom Kunden zu erhalten" : "Müşteriden Alınacak"}
                                      </p>

                                      <p className="text-sm font-black text-orange-950">
                                        {getDriverOrderTotal(order).toFixed(2)}{" "}
                                        €
                                      </p>
                                    </div>
                                  </div>

                                  {order.status !== "DELIVERED" ? (
                                    <button
                                      type="button"
                                      disabled={updatingOrderId === order.id}
                                      onClick={() => savePfand(order)}
                                      className="rounded-md bg-orange-500 px-2.5 py-1.5 text-[10px] font-black text-white transition hover:bg-orange-600 disabled:opacity-50"
                                    >
                                      {updatingOrderId === order.id
                                        ? "Kaydediliyor..."
                                        : "Pfand Miktarını Kaydet"}
                                    </button>
                                  ) : (
                                    <div className="rounded-md bg-green-100 px-2 py-1 text-[10px] font-black text-green-700">
                                      Pfand Kesinleşti
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-4 w-full max-w-[520px] rounded-xl border border-green-200 bg-green-50 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <h4 className="text-sm font-black text-slate-950">
                                      {language === "de" ? "Pfand-Übergabe" : "Pfand Teslimi"}
                                    </h4>

                                    <p className="mt-1 text-[11px] text-slate-600">
                                      {language === "de"
                                        ? "Zählen Sie das vom Kunden zurückgegebene Pfand und ziehen Sie es vom zu erhaltenden Betrag ab."
                                        : "Müşterinin verdiği Pfandları sayın ve müşteriden alınacak tutardan düşün."}
                                    </p>
                                  </div>

                                  {order.status !== "DELIVERED" ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewPfandOrderId((current) =>
                                          current === order.id
                                            ? null
                                            : order.id,
                                        );

                                        resetNewPfandForm();
                                      }}
                                      className="rounded-lg bg-green-600 px-3 py-2 text-xs font-black text-white transition hover:bg-green-700"
                                    >
                                      {newPfandOrderId === order.id
                                        ? "Pfand Girişini Kapat"
                                        : "Pfand Gir"}
                                    </button>
                                  ) : (
                                    <span className="rounded-lg bg-slate-200 px-3 py-2 text-[10px] font-black text-slate-500">
                                      {language === "de" ? "Bestellung zugestellt" : "Sipariş Teslim Edildi"}
                                    </span>
                                  )}
                                </div>

                                {newPfandOrderId === order.id &&
                                order.status !== "DELIVERED" ? (
                                  <div className="mt-3">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      {driverPfandTypes.map((pfandType) => (
                                        <label
                                          key={pfandType.key}
                                          className="rounded-lg bg-white p-3"
                                        >
                                          <span className="text-[11px] font-black text-slate-700">
                                            {pfandType.label}
                                          </span>

                                          <input
                                            type="number"
                                            min="0"
                                            max="9999"
                                            step="1"
                                            inputMode="numeric"
                                            value={
                                              newPfandValues[pfandType.key] ||
                                              ""
                                            }
                                            disabled={
                                              updatingOrderId === order.id
                                            }
                                            onChange={(event) =>
                                              setNewPfandValues((current) => ({
                                                ...current,

                                                [pfandType.key]:
                                                  event.target.value.replace(
                                                    /\D/g,
                                                    "",
                                                  ),
                                              }))
                                            }
                                            placeholder={language === "de" ? "Menge" : "Adet"}
                                            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-green-500 disabled:bg-slate-100"
                                          />
                                        </label>
                                      ))}
                                    </div>

                                    <div className="mt-3 rounded-lg bg-white p-3">
                                      <div className="flex justify-between gap-4">
                                        <span className="text-xs font-bold text-slate-600">
                                          {language === "de" ? "Erhaltenes Pfand" : "Alınan Pfand"}
                                        </span>

                                        <strong className="text-sm text-green-700">
                                          {getNewPfandTotal().toLocaleString(
                                            "de-DE",
                                            {
                                              style: "currency",
                                              currency: "EUR",
                                            },
                                          )}
                                        </strong>
                                      </div>

                                      <div className="mt-2 flex justify-between gap-4 border-t border-slate-100 pt-2">
                                        <span className="text-xs font-black text-slate-950">
                                          {language === "de" ? "Vom Kunden zu erhalten" : "Müşteriden Alınacak"}
                                        </span>

                                        <strong className="text-sm text-slate-950">
                                          {Math.max(
                                            0,
                                            order.subtotal +
                                              order.pfandAmount +
                                              order.deliveryFee -
                                              getNewPfandTotal(),
                                          ).toLocaleString("de-DE", {
                                            style: "currency",
                                            currency: "EUR",
                                          })}
                                        </strong>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={
                                        updatingOrderId === order.id ||
                                        getNewPfandTotal() <= 0
                                      }
                                      onClick={() => createPfand(order)}
                                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-xs font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                      {updatingOrderId === order.id ? (
                                        <>
                                          <Loader2
                                            size={16}
                                            className="animate-spin"
                                          />
                                          {t.savingPfand}
                                        </>
                                      ) : (
                                        t.savePfandAndDeduct
                                      )}
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
