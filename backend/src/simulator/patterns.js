export const SQLI_PATTERNS = [
  "' OR '1'='1' --",
  "\" OR \"1\"=\"1\" --",
  "UNION SELECT username, password FROM users --",
  "'; DROP TABLE users; --",
  "admin' --"
];

export const XSS_PATTERNS = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "<svg/onload=alert('xss')>"
];

export const SUSPICIOUS_UA = [
  "sqlmap",
  "nmap",
  "dirbuster",
  "nikto",
  "python-requests",
  "masscan"
];

// Realistic business activities
export const BUSINESS_ACTIVITIES = [
  {
    event_type: "user_login",
    url: "/auth/login",
    method: "POST",
    description: "User authentication",
    status_codes: [200, 401],
    metadata_extras: () => ({
      username: randomChoice(["john.doe", "alice.smith", "bob.wilson", "sarah.johnson"]),
      session_id: `sess_${Math.random().toString(36).substring(7)}`
    })
  },
  {
    event_type: "product_purchase",
    url: "/api/orders",
    method: "POST", 
    description: "Product purchase transaction",
    status_codes: [201, 400],
    metadata_extras: () => ({
      order_id: `ORD_${Math.floor(Math.random() * 100000)}`,
      amount: (Math.random() * 500 + 10).toFixed(2),
      payment_method: randomChoice(["credit_card", "paypal", "bank_transfer"])
    })
  },
  {
    event_type: "product_view",
    url: "/products",
    method: "GET",
    description: "Product catalog browsing",
    status_codes: [200, 404],
    metadata_extras: () => ({
      product_id: `PROD_${Math.floor(Math.random() * 1000)}`,
      category: randomChoice(["electronics", "clothing", "books", "home"])
    })
  },
  {
    event_type: "user_logout",
    url: "/auth/logout",
    method: "POST",
    description: "User session termination",
    status_codes: [200],
    metadata_extras: () => ({
      session_duration: `${Math.floor(Math.random() * 3600)}s`
    })
  },
  {
    event_type: "search_query",
    url: "/api/search",
    method: "GET",
    description: "Product search activity",
    status_codes: [200, 400],
    metadata_extras: () => ({
      query: randomChoice(["laptop", "shoes", "book", "phone", "headphones"]),
      results_count: Math.floor(Math.random() * 100)
    })
  },
  {
    event_type: "inventory_update",
    url: "/api/inventory",
    method: "PUT",
    description: "Inventory management",
    status_codes: [200, 404],
    metadata_extras: () => ({
      product_id: `PROD_${Math.floor(Math.random() * 1000)}`,
      quantity_change: Math.floor(Math.random() * 20) - 10,
      warehouse: randomChoice(["WH_A", "WH_B", "WH_C"])
    })
  },
  {
    event_type: "cart_add",
    url: "/api/cart",
    method: "POST",
    description: "Item added to shopping cart",
    status_codes: [200, 400],
    metadata_extras: () => ({
      product_id: `PROD_${Math.floor(Math.random() * 1000)}`,
      quantity: Math.floor(Math.random() * 5) + 1
    })
  },
  {
    event_type: "user_registration",
    url: "/auth/register",
    method: "POST",
    description: "New user account creation",
    status_codes: [201, 409],
    metadata_extras: () => ({
      username: `user_${Math.random().toString(36).substring(7)}`,
      email_domain: randomChoice(["gmail.com", "yahoo.com", "company.com"])
    })
  }
];

export const NORMAL_URLS = [
  "/", "/home", "/products", "/search?q=item",
  "/login", "/dashboard", "/api/v1/list"
];

export const METHODS = ["GET", "POST", "GET", "GET", "POST"];

// Helper function for random choice
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}
