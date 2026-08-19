"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useLanguage } from "@/context/LanguageContext";

import {
  Building2,
  Home,
  Loader2,
  MapPin,
  UserRound,
} from "lucide-react";

import Link from "next/link";

import {
  FormEvent,
  useState,
} from "react";

type CustomerType =
  | "PRIVATE"
  | "BUSINESS";

export default function RegisterClient({
  initialSettings,
}: {
  initialSettings?: any;
} = {}) {
  const {
    language,
    translations,
  } = useLanguage();

  const t = {
    ...translations[language].register,
    countryValue:
      language === "de"
        ? "Deutschland"
        : "Almanya",
    connectionError:
      language === "de"
        ? "Beim Verbinden mit dem Server ist ein Fehler aufgetreten."
        : "Sunucuya bağlanırken bir hata oluştu.",
  };

  const [
    customerType,
    setCustomerType,
  ] =
    useState<CustomerType>(
      "PRIVATE"
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setIsLoading(true);

    const formData =
      new FormData(
        event.currentTarget
      );

    const postalCode =
      String(
        formData.get(
          "postalCode"
        ) || ""
      ).trim();

    if (
      !/^\d{5}$/.test(
        postalCode
      )
    ) {
      setError(
        t.postalCodeError
      );

      setIsLoading(false);

      return;
    }

    const payload = {
      firstName:
        formData.get(
          "firstName"
        ),

      lastName:
        formData.get(
          "lastName"
        ),

      email:
        formData.get(
          "email"
        ),

      phone:
        formData.get(
          "phone"
        ),

      password:
        formData.get(
          "password"
        ),

      customerType,

      companyName:
        customerType ===
        "BUSINESS"
          ? formData.get(
              "companyName"
            )
          : null,

      street:
        formData.get(
          "street"
        ),

      houseNumber:
        formData.get(
          "houseNumber"
        ),

      postalCode,

      city:
        formData.get(
          "city"
        ),

      doorbellName:
        formData.get(
          "doorbellName"
        ),

      language,
    };

    try {
      const response =
        await fetch(
          "/api/auth/register",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            t.requiredError
        );

        return;
      }

      window.location.href =
        "/verify-email?email=" +
        encodeURIComponent(String(payload.email));
    } catch {
      setError(t.connectionError);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <Header initialSettings={initialSettings} />

      <section className="px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[32px] bg-white p-6 shadow-sm sm:p-10">
            <p className="font-bold text-orange-500">
              {t.eyebrow}
            </p>

            <h1 className="mt-2 text-4xl font-black text-slate-950">
              {t.title}
            </h1>

            <p className="mt-3 text-slate-500">
              {t.description}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setCustomerType(
                    "PRIVATE"
                  )
                }
                className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
                  customerType ===
                  "PRIVATE"
                    ? "border-orange-500 bg-orange-50"
                    : "border-slate-200"
                }`}
              >
                <Home
                  size={22}
                  className="text-orange-500"
                />

                <div>
                  <p className="font-black">
                    {t.privateCustomer}
                  </p>

                  <p className="text-sm text-slate-500">
                    {
                      t.privateDescription
                    }
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setCustomerType(
                    "BUSINESS"
                  )
                }
                className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
                  customerType ===
                  "BUSINESS"
                    ? "border-orange-500 bg-orange-50"
                    : "border-slate-200"
                }`}
              >
                <Building2
                  size={22}
                  className="text-orange-500"
                />

                <div>
                  <p className="font-black">
                    {t.businessCustomer}
                  </p>

                  <p className="text-sm text-slate-500">
                    {
                      t.businessDescription
                    }
                  </p>
                </div>
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-10 space-y-10"
            >
              <section>
                <div className="flex items-center gap-3">
                  <UserRound className="text-orange-500" />

                  <h2 className="text-xl font-black">
                    {
                      t.personalInfo
                    }
                  </h2>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Input
                    label={
                      t.firstName
                    }
                    name="firstName"
                  />

                  <Input
                    label={
                      t.lastName
                    }
                    name="lastName"
                  />

                  {customerType ===
                  "BUSINESS" ? (
                    <div className="sm:col-span-2">
                      <Input
                        label={
                          t.companyName
                        }
                        name="companyName"
                      />
                    </div>
                  ) : null}

                  <Input
                    label={
                      t.phone
                    }
                    name="phone"
                    type="tel"
                  />
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3">
                  <MapPin className="text-orange-500" />

                  <h2 className="text-xl font-black">
                    {
                      t.addressInfo
                    }
                  </h2>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Input
                    label={
                      t.street
                    }
                    name="street"
                  />

                  <Input
                    label={
                      t.houseNumber
                    }
                    name="houseNumber"
                  />

                  <Input
                    label={
                      t.postalCode
                    }
                    name="postalCode"
                    inputMode="numeric"
                    maxLength={5}
                  />

                  <Input
                    label={
                      t.city
                    }
                    name="city"
                  />

                  <label>
                    <span className="text-sm font-bold text-slate-700">
                      {t.country} *
                    </span>

                    <input
                      value={t.countryValue}
                      readOnly
                      className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
                    />
                  </label>

                  <div className="sm:col-span-2">
                    <Input
                      label={
                        t.doorbellName
                      }
                      name="doorbellName"
                      required={false}
                      helperText={t.doorbellNameHint}
                    />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-black">
                  {
                    t.loginInfo
                  }
                </h2>

                <div className="mt-5 space-y-5">
                  <Input
                    label={
                      t.email
                    }
                    name="email"
                    type="email"
                  />

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      {t.password} *
                    </span>

                    <input
                      required
                      minLength={8}
                      name="password"
                      type="password"
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                    />

                    <span className="mt-2 block text-xs text-slate-400">
                      {
                        t.passwordHint
                      }
                    </span>
                  </label>
                </div>
              </section>

              {error ? (
                <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700">
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={
                  isLoading
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-4 font-black text-white transition hover:bg-orange-600 disabled:bg-orange-300"
              >
                {isLoading ? (
                  <>
                    <Loader2
                      size={20}
                      className="animate-spin"
                    />

                    {
                      t.submitting
                    }
                  </>
                ) : (
                  t.submit
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {
                t.alreadyAccount
              }{" "}

              <Link
                href="/login"
                className="font-bold text-orange-500"
              >
                {t.login}
              </Link>
            </p>
          </div>
        </div>
      </section>

      <Footer initialSettings={initialSettings} />
    </main>
  );
}

type InputProps = {
  label: string;
  name: string;
  type?: string;
  inputMode?:
    | "text"
    | "numeric";
  maxLength?: number;
  required?: boolean;
  helperText?: string;
};

function Input({
  label,
  name,
  type = "text",
  inputMode,
  maxLength,
  required = true,
  helperText,
}: InputProps) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">
        {label} {required ? "*" : ""}
      </span>

      <input
        required={required}
        name={name}
        type={type}
        inputMode={
          inputMode
        }
        maxLength={
          maxLength
        }
        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-orange-500"
      />

      {helperText ? (
        <span className="mt-1 block text-xs text-slate-400">
          {helperText}
        </span>
      ) : null}
    </label>
  );
}
