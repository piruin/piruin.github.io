---
title: Implement Jersey security without web.xml
tags: ["Jersey", "Jetty", "RESTful", "jax-rs"]
lang: th
category: java
---

การจะ Implement Security ด้วย Annotation ตามมาตรฐาน JAX-RS 2.0 บน Jersey ใน Document บอกให้ทำ config ที่ web.xml
แต่เนื่องจากผมเป็นมือใหม่เรื่อง Java Web Server บอกเลยว่าใช้ web.xml ไม่เป็น ตัว api ที่ทำอยู่ตอนนี้ก็เป็น Jetty Embedded
และดูแล้วก็ไม่ใช่สไตล์เท่าไหร่ ชอบการ Config ด้วย code มากกว่า เลยทำให้ต้องวิธีเอง งงบัคตัวเองอยู่ตั้งนาน หุหุ

> ยังคงมีแต่เรื่อง Api ให้เขียนเนื่องจาก Android มีคนทำแทนแล้ว ไล่ตัวเองมาทำ Api แทน

มาดูโจทย์กัน

```java
@Path("/resource")
public Resource{

   @RoleAllow("user")
   @Path(/private)
   public Response privateRes(){
     ...
   }

   @PermitAll
   @Path(/public)
   public Response publicRes(){
     ...
   }
```

ผมต้องการให้ทุกคนเข้าถึง `resource/public` ได้ แต่ที่ `resource/private` อยากให้เฉพาะ user
เท่านั้นที่เข้าได้ ด้วย Security Annotation

สิ่งที่เราต้องทำคือ

- เราต้องเปิดใช้งาน **Security Annotation** ตามมาตรฐาน JAX-RS 2.0 ซะก่อน  เนื่องจาก Jersey
ไม่ได้เปิดใช้งาน Feature นี้โดย default เราต้องเปิดเองถึงจะใช้ annotation เช่น  `@PermitAll`, `@DenyAll`
และ `@RoleAllow` ได้

- implement `SecurityContext` ของเราเอง ซึ่งจะเก็บข้อมูลเกี่ยวกับความปลอดภัย ได้แก่ User ที่ connect มาชื่ออะไร
บทบาทอะไร (Role) Connect มาแบบปลอดภัยหรอไม่ ในที่นี้ถ้าเราใช้ web.xml และ config เป็นเราก็จะได้ค่าพวกนี้มาเลย
แต่ถ้าเราไม่ใช้หละก็ `SecurityContext` จะไม่มีค่าอะไรพวกนี้เลย return false ตลอดการ

## เปิดใช้ Security Annotation

ด้วยการ register `RolesAllowedDynamicFeature` class ให้กับ `ResourceConfig` ซะก่อน

```java
public class ApplicationConfig extends ResourceConfig{
    public ApplicationConfig() {
        packages("com.awesome.api");
        register(JacksonFeature.class);
        register(RolesAllowedDynamicFeature.class);
    }
}
```

เมื่อเราทำการ Regis `RolesAllowedDynamicFeature`  จะเท่ากับว่าเราเปิดใช้งาน Security Annotation แล้ว
เมื่อมี Request เข้ามาที่ `/resource/private` server จะทำการเรียก`isUserRole(user)` ของ SecurityContext
ถ้า Method นี้ return `true` ก็จะได้ข้อมูลไป  แต่ถ้าเป็น false จะเจอ 403 Fobidden แทน

ซึ่งตอนนี้ `SecurityContext` ของเรายังไม่มีค่าอะไรดังนั้น Request อะไรเข้ามาก็เข้าถึงส่วนที่เป็น Private ไม่ได้แน่นอน

## Implement SecurityContext

เราต้องสร้าง Filter ที่ทำงานตรวจสอบข้อมูลเกี่ยวกับการยืยนยันตัวตนทุกครั้งเมื่อมี Request เข้ามาที่ api  เช่นตัวอย่างต่อไปนี้

### Authentication Filter

```java
@Priority(1)
@Provider
public class AuthenticationFilter implements ContainerRequestFilter {
    private static final ErrorMessage UNAUTHORIZED = new ErrorMessage(401, "ชื่อ หรือ รหัสผ่านไม่ถูกต้อง");
    private static final ErrorMessage FORBIDDEN = new ErrorMessage(403, "คุณไม่มีสิทธิเข้าใข้งาน");

    @Override
    public void filter(ContainerRequestContext requestContext) {
        if (!BasicAuthenticationInfo.hasAuthorizeProperty(requestContext)) { //[1]
            return;
        }
        BasicAuthenticationInfo authenInfo = new BasicAuthenticationInfo(requestContext); //[2]
        UserDao userDao = new DBI(new ConfigurationDB().getDatasource()).onDemand(UserDao.class);
        User user = userDao.find(authenInfo.getUsername(), authenInfo.getPassword());
        if (user == null) {
            throw new FaarmisException(401, UNAUTHORIZED);
        }
        if (!isAllow(user)) {
            throw new FaarmisException(403, FORBIDDEN);
        }
       String urlScheme = requestContext.getUriInfo().getBaseUri().getScheme(); //[3]
        AuthenticationContext authenticationContext = new AuthenticationContext(user, urlScheme);
        requestContext.setSecurityContext(authenticationContext);  //[4]
   }
}

```

>โค้ดนี้เป็นตัวอย่างให้พอเห็น Concept นะครับ  Copy ไปใช้เลยไม่ได้นะ

มาดูกันว่ามันทำอะไรบ้าง

1. ตรวจสอบก่อนว่ามีข้อมูลการยืนยันตัวตนเข้ามาหรือป่าว ในตัวอย่างนี้ใช้ Basic Authentication  ถ้าไม่มี filter หยุดทำงานเลย ซึ่งจะมีผลให้ SecurityContext
ไม่มีข้อมูลอะไร Request นั้นก็จะเข้าถึงได้แต่ endpoint ไปเป็น `@PermitAll`
2. เอาข้อมูลการยืนยันตัวตนไปลองหาในฐานข้อมูลดูว่าเจอไหม ถ้าไม่เจอก็ Return 401 ไปเลย หรือถ้าเจอแต่ไม่ใช่ user ที่เราอยากให้เข้าถึงได้เช่นเป็น Blacklist
เราก็ return 403 ไปแทน
3. ถ้าผ่านข้อ 2 มากได้ เราจะเอาข้อมูลที่ได้มาสร้าง `SecurityContext`
4. ทำการ set ค่า `SecurityContext` ให้กับ Request นั้น เพื่อใช้ตรวจสอบกับ Security Annotation ต่อไป

สังเกตุ `@Priority(1)` นะครับ เป็นจุดสำคัญมากๆ ถ้าไม่กำหนดไว้เป็นค่าต่ำๆ filter นี้อาจจะทำงานหลัง filter ของ Security Annotation
ซึ่งหมายความว่าตอนนั้นจะยังไม่มี `SecurityContex` ทำให้การทำงานไม่เป็นอย่างที่ต้องการ  ส่วน `@Provider` จะช่วย Register filter นี้เข้าไปใน
`ResourceConfig` ที่เราทำไปก่อนหน้าอัติโนมัติเลย ถ้าหากอยู่ภายใต้ package ที่กำหนดไว้ใน resource Config

ที่นี้มาดูการสร้าง `SecurityContext` กัน

### Security Context

```java
public class AuthenticationContext implements SecurityContext {
    private static final String HTTPS = "https://";
    private final Principal userPrincipal;
    private final String scheme;

    public AuthenticationContext(final User user, String scheme) {
        this.userPrincipal = () -> user.getUsername();
        this.scheme = scheme;
    }
    @Override public Principal getUserPrincipal() {
        return userPrincipal;
    }
    @Override public boolean isUserInRole(String role) {
        return "user".equals(role);
    }
    @Override public boolean isSecure() {
        return scheme.startsWith(HTTPS);
    }
    @Override public String getAuthenticationScheme() {
        return BASIC_AUTH;
    }
}
```

เราทำการสร้าง class ที่ implement interface `SecurityContext` ซึ่งจะมีอยู่ 4 method ด้วยกันได้แก่

- `getUserPrincipal()` ให้เราทำการ implement interface `Principal` เพื่อคืนชื่อของ user
ที่ Request api เข้ามา ในตัวอย่างผมให้ใช้ค่าที่ได้จาก `getUsername()` ของ `User`
- `isUserInRole(role)` นี้หละจุดสำคัญของบทความนี้ ค่าที่ถูกส่งเข้ามาใน method นี้จะไปค่าที่เป็น
parameter ของ @RoleAllows ถ้าเรา return true  Request ก็จะไม่โดนแตะออก
- `isSecure()` อันนี้ implement ง่ายครับ เช็คแค่ว่าเป็น HTTPS รึเปล่าพอ
- `getAuthenticationScheme()` เรายืนยันตัวตนด้วยวิธีไหนก็ระบุไป เช่น BASIC OAUTH

เพียงเท่านี้เราก็จะใช้งาน Security Annotation ได้ 100% โดยไม่จำเป็นต้องใช้ Web.xml เลยครับ
นอกจากนั้นเรายังมี SecurityContext ไว้ใช้ประโยชน์เพิ่มเติมในภายหลังได้นะ ดูแล้วอีกคุ้มรึเปล่าน้าาา~
ถ้ามีอะไรแนะนำ อะไรผิด รู้วิธีที่ดีกว่านี้ หรือมีทางเลือกอื่นก็มาแชร์กันนะครับ
