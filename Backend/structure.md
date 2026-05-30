## 🏛️ Team Presentation: Hamare Registration Flow mein Hexagonal Architecture

Registration flow mein humne apne code ko 3 different concentric rings (hisson) mein share kiya hai: **Domain (Core)**, **Application (Use Cases & Ports)**, aur **Infrastructure (Adapters)**.

Aik hi barri monolithic Express file likhne ki bajaye, humne files ko chota aur split kar diya hai taa ke hamara core business logic database ya kisi framework (jaise Express) ke change hone se bilkul safe aur azaad (immune) rahe.

---

### 1. The Core Domain Layer (Entities)
* **Location:** `src/domain/entities/`
* **Yeh kya hai (What it is):** 
  Hamare company data ki bilkul pure aur basic business definitions.
* **Yeh kyun banayi (Why it exists):** 
  Isme bilkul ZERO external dependencies hain—na to Express hai, na hi Mongoose hai, aur na hi koi teesri external library. Yeh sirf pure business logic ko represent karti hai.
  Agar kal ko hum Mongoose se PostgreSQL par switch karein, ya koi desktop app bhi banayein, to yeh entities bilkul 100% same raheingi (inme koi change nahi aayega).
* **Key Example:** 
  `registercompanyinfo.js` registration ke dauran company entity ke pure core structure ko define karti hai.

---

### 2. The Application Layer (Use Cases & Ports)
Yeh layer hamare business rules ko chalane aur control karne ka kaam karti hai. Yeh yeh to batati hai ke hamari application kya karegi, lekin yeh nahi batati ke data ko save kahan aur kaise karna hai.

#### A. Use Cases
* **Location:** `src/application/useCases/`
* **Yeh kya karti hai (What it does):** 
  Kisi aik single business task (jaise ke "API details ko save karna") ko orchestrate/manage karti hai.
* **Yeh kyun banayi (Why it exists):** 
  Yeh Dependency Injection ke zariye database repository adapter ko receive karti hai, incoming data ko check/validate karti hai, aur database mein save karne ke liye repository ko call karti hai.
  Yeh HTTP requests (`req`/`res`) aur direct database/mongoose query details se bilkul alag (isolated) hoti hai.

#### B. Ports
* **Location:** `src/application/ports/`
* **Yeh kya hai (What it does):** 
  Hexagonal Architecture mein Port asal mein aik "Interface Contract" (kuch strict rules ka set) hota hai.
* **Yeh kyun banayi (Why it exists):** 
  Yeh aik security guard ki tarah kaam karta hai. Yeh is baat ko pakka (enforce) karta hai ke hum jo bhi database adapter apne Use Case mein pass kar rahe hain, usme specific methods (jaise `create`, `findById`, aur `update`) lazmi majood hon.
  Agar database adapter is rule (interface) ke mutabik na ho, to server start hotay hi descriptive error aa jata hai.

---

### 3. The Infrastructure Layer (Adapters)
Yeh hexagon ki sab se bahar wali layer hai. Yeh bahar ki duniya (web clients, database tables) se baat karti hai.

#### A. Driving Adapters (HTTP Controllers & Routes)
* **Location:** `src/adapters/http/`
* **Yeh kya karti hai (What it does):** 
  Aane wali HTTP requests ko receive karti hai, body/cookies/params ko nikaalti hai, use application ke Use Case mein pass karti hai, aur result ko wapis JSON response bana kar send karti hai.
* **Yeh kyun banayi (Why it exists):** 
  Express se related saari coding isi layer mein hoti hai. Agar hum kal ko Express ko chorr kar NestJS ya Fastify par chale jayein, to sirf hamare controllers aur routes ki files change hongi, core use cases ko haath bhi lagana nahi parega!

#### B. Driven Adapters (Persistence Repositories & Models)
* **Location:** `src/adapters/persistence/`
* **Yeh kya karti hai (What it does):** 
  Talks directly to MongoDB Atlas using Mongoose Models. Yeh Port ke banaye hue database methods ko implement karti hai.
* **Yeh kyun banayi (Why it exists):** 
  Mongoose ki specific query coding (`findOne`, `findByIdAndUpdate`, `.lean()`) sab yahan hoti hai. Agar hum MongoDB ko hata kar PostgreSQL ya Sequelize lagana chahein, to hum sirf yahan aik nai Repository file likhein ge, baaki pora application bilkul same aur safe rahega!

---

### 💎 Hamari Team Ke Liye Is Architecture Ke Kya Faide Hain? (Benefits)

1. **Easy Testability (Unit Testing):** Hum database se connect kiye bina ya Express server chalaye bina bhi mock repositories (simple JS objects) pass kar ke apne Use Cases aur Domain logic ko baasani test kar sakte hain.
2. **Framework Independence:** Hamare core features aur business logic kisi specific database (Mongoose) ya web framework (Express) ke mohtaj nahi hain.
3. **No Spaghetti Code (Saaf aur Paak Code):** Har file ki apni aik single responsibility hai. Routes sirf route karte hain, controllers sirf HTTP handle karte hain, repositories database chalati hain, aur use cases sirf business rules apply karte hain.