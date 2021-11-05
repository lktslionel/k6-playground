import { check,  } from 'k6';
import { Options } from 'k6/options';
import http from 'k6/http';
import {ObjectBatchRequest} from 'k6/http';
import { randomString, randomItem } from 'https://jslib.k6.io/k6-utils/1.1.0/index.js';


const getEnvVar = (name: string): string => {
  if (!__ENV[name]) {
    throw new Error(`No value set for env var[${name}]`)
  }
  return __ENV[name]
}

const API_BASE_URL = "https://api-staging.beverage-platform.com"

export const options: Options = {
  vus: 1,
  iterations: 200,
  duration: '3m',
  
  ext: {
    loadimpact: {
      projectID: 3556288,
      name: "Black Friday 2021 - Scenario 1 — Create orders customer"
    },
  },
};

const buildOrdersPayloadFromUserAndOrderId = (email: string, orderId: number):string => {
  return `{
    "shop": "/api/shops/26",
    "lang": "/api/langs/1",
    "orderType": "/api/order_types/8",
    "state": "/api/order_states/2",
    "payment": "marketplace",
    "currency": "/api/currencies/2",
    "carrier": "/api/carriers/182",
    "customer": {
        "plainPassword": "",
        "email": "${email}",
        "shop": "/api/shops/26",
        "newsletter": false,
        "sms": false,
        "active": true,
        "guest": false,
        "lang": "/api/langs/1",
        "firstname": "AnonFirstname",
        "lastname": "AnonLastname"
    },
    "shippingAddress": {
        "country": "/api/countries/17",
        "postcode": "G839bx",
        "firstname": "AnonAddressFirstname",
        "lastname": "AnonAddressLastname",
        "phonePrimary": "01234567890",
        "email": "${email}",
        "company": "Anon Company",
        "streetAddress1": "999 Quality Street",
        "streetAddress2": "Crossgates",
        "city": "Leeds"
    },
    "billingAddress": {
        "country": "/api/countries/17",
        "postcode": "G839bx",
        "firstname": "AnonAddressFirstname",
        "lastname": "AnonAddressLastname",
        "phonePrimary": "01234567890",
        "email": "beerhawk.testing+anonaddress@gmail.com",
        "company": "Anon Company",
        "streetAddress1": "999 Quality Street",
        "streetAddress2": "Crossgates",
        "city": "Leeds"
    },
    "totalPaid": "63.00",
    "totalPaidReal": "63.00",
    "totalPaidTaxExcl": "52.50",
    "totalPaidTaxIncl": "63.00",
    "totalProducts": "63.00",
    "totalShipping": "0.00",
    "totalShippingTaxExcl": "0.00",
    "totalShippingTaxIncl": "0.00",
    "deliveryPromiseDate": "2021-07-08",
    "shippingPromiseDate": "2021-07-07",
    "gift": false,
    "giftMessage": null,
    "orderDetails": [
        {
            "product": "/api/products/${orderId}",
            "productName": "PerfectDraft Tennent'\''s Lager 6L Keg [Limited 2 per Customer]",
            "productQuantity": 2,
            "productWeight": 7.5,
            "totalShippingPrice": "0.00",
            "totalShippingPriceWithoutTax": "0.00",
            "taxRate": "20.0",
            "productPrice": "31.50",
            "totalPrice": "63.00",
            "totalPriceWithoutTax": "52.50",
            "price": "31.50",
            "priceWithoutTax": "26.25",
            "originalProductPrice": "31.50"
        }
      ],
      "externalId": "PM_${ randomString(12) }"
  }`
}

interface GeneratorOptions {
  method: 'GET' | 'POST'
  url: string
  params: object
  email: string
  orderId: number
}

const generateBatchRequestsOfWithOptions = (n: number, opts: GeneratorOptions): ObjectBatchRequest[] => {
  
  return Array.from(Array(n).keys()).map((_) => {
    return {
        method: opts.method,
        url: opts.url,
        body: buildOrdersPayloadFromUserAndOrderId(opts.email, opts.orderId),
        params: opts.params,
    }
  })
}

export function setup() {

  // 43720: https://admin-staging.beverage-platform.com/en/products/products-detail.html?id=43720  
  // 43740: https://admin-staging.beverage-platform.com/en/products/products-detail.html?id=43740
  const orderIds = [43720, 43740]
  
  const existingCustomerEmail = "beerhawk.testing+anoncustomer@gmail.com"

  const API_KEY = getEnvVar("API_KEY")
  const API_ID_EMAIL = getEnvVar("API_ID_EMAIL")
  
  const params = {
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
      "x-organization": "2",
      "interdrinks-email": API_ID_EMAIL,
    },
  };

  return {
    url: `${API_BASE_URL}/orders`,
    orderIds: orderIds,
    customerEmail: existingCustomerEmail,
    params: params,

    reqBatchSize: Number.parseInt(__ENV.REQ_BATCH_SIZE) || 1
  }
}


export default (data: any) => {

  const batchSize = data.reqBatchSize
  
  const reqOptions: GeneratorOptions = {
    method: 'POST',
    url: data.url,
    params: data.params,
    email: data.existingCustomerEmail,
    orderId: randomItem(data.orderIds),
  }

  generateBatchRequestsOfWithOptions(batchSize, reqOptions).forEach((req) => {
    const res = http.request(req.method, req.url, req.body, req.params)
    check(res, {
      "Order creation successfully submitted": (res) => res.status == 201
    })
  })

}
