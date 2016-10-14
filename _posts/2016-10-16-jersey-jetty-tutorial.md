---
title: Tutorial RESTFul Service by Jersey and Jetty Embedding
description: วิธีการสร้าง JSON RESTful Service  ด้วย Jersey + Jackson Media และ Embedded Jetty ทำการ Build ด้วย Gradle
tags: ["Jersey", "Jetty", "RESTful"]
lang: th
---

วันนี้เราจะ setup RESTFul service ด้วยการใช้ Jersey และ Jetty แบบ Embedded กันแบบง่ายๆ โดย Service ของเราสามารถคืน POJO เป็น เป็น JSON อัพโนมัติด้วย Jackson ได้ด้วย

> Project นี้ผมใช้ Gradle เป็นตัว Build นะครับ ถ้าใช้ Maven ก็ลองเปลี่ยนดูครับ ต่างกันแค่ตรงประกาศ dependency

## เริ่มต้นแบบ Basic

เริ่มจากการกำหนด Dependency ใน `build.gradle` ให้เป็นตามนี้

```groovy
dependencies {
    def jettyVersion = "9.3.12.v20160915"
    def jerseyVersion = "2.23.2"

    compile "org.eclipse.jetty:jetty-server:$jettyVersion"
    compile "org.eclipse.jetty:jetty-servlet:$jettyVersion"
    compile "org.eclipse.jetty:jetty-http:$jettyVersion"
    compile "org.glassfish.jersey.containers:jersey-container-servlet-core:$jerseyVersion"
    compile "org.glassfish.jersey.containers:jersey-container-jetty-servlet:$jerseyVersion"
}
```

หลังจากกำหนด Dependency และทำการ Sync Gradle ใหม่แล้ว  เราจะสามารถอ้างถึง Class ต่างๆของ Jetty และ Jersey ได้แล้ว

ต่อไปเราจะทำการให้โปรแกรมของเรา start server เมื่อเราทำการ execute .jar ด้วย code ดังนี้ที่ Class หลักของเรา  หรือก็คือ class ที่มี `public void main(String[] args)`

```java
public void main(String[] args){
    Server server = new Server(2222);
    ServletContextHandler context = new ServletContextHandler(server, "/*");

    ServletHolder jersey = new ServletHolder(new ServletContainer(config));
    jersey.setInitOrder(0);
    jersey.setInitParameter(“jersey.config.server.provider.classnames”,
        SayHello.class.getCanonicalName());
    context.addServlet(jersey , "/*");

    try {
        server.start();
        server.join();
    } finnaly {
        server.destroy();
    }
}
```

และเพิ่ม class ที่เป็นตัว Service จริงๆ ในที่นี้เราจะสร้าง `SayHello.class` มีหน้าตาดังนี้

```java
public class SayHello{

     @GET
     @Path(“/say”)
     @Produces("text/plain")
     public String say(){
          return “Hello"
     }
}
```

ที่นี้เราก็ Start server ของเราได้เลย ลองเปิด Browser แล้วเข้าไปที่ `localhost:2222/say` เราจะเจอขอความว่า `hello`

## มี Servlet มากกว่า 1 class
ในชีวิตจริง Service ของเราต้องมีมากกว่า 1 class แน่นอน คงไม่มีใครเขียน Service จริงๆ ให้จบใน Class เดียวจริงไหม? หรือว่ามี?

สิ่งที่เราต้องทำคือไปที่ Main Class ของเราแล้วแก้ให้เป็นดังต่อไปนี้

```java
public void main(String[] args){
    Server server = new Server(2222);

    ServletHolder jersey = new ServletHolder(new ServletContainer());
    jersey.setInitOrder(0);
    jersey.setInitParameter(“jersey.config.server.provider.classnames”,
        String.join(“, “,
              SayHello.class.getCanonicalName(),
              Second.class.getConicalName(),
              Third.class.getConicalName())
        );

    ServletContextHandler context = new ServletContextHandler(server, "/*");
    context.addServlet(jersey , "/*");

    try {
        server.start();
        server.join();
    } finnaly {
        server.destroy();
    }
}
```

สังเกตสิ่งที่เปลี่ยนแปลงในบรรทัดที่ 7-11 แทนที่เราจะส่งชื่อ class ไป class เดียว เราเอามันมาเชื่อมกันโดยขั้นด้วย `,` แทน 
ทีนี้จะมีเพิ่มกี่ class ก็ comma แล้วใส่เพิ่มไปเรื่อยๆได้เลย

## Return เป็น JSON ด้วย Jackson Media
ถ้าเราต้องการ Response แบบ `application/json` จาก POJO เราก็ทำดังนี้

```java
public class JsonResource{

     @GET
     @Path(“/josn”)
     @Produces(“application/json")
     public Entity fromPojo(){
          return new Entity(“Say hi, Json”);
     }

     public class Entity{
          public String message;

          public Entity(String msg){
              message = msg;
          }
     }
}
```

จริงๆเรื่องมันควรจบง่ายๆแค่นี้ แต่ถ้าเราลองเรียก Service นี้เราจะพบ Internal Server Error 
ที่เป็นเช่นนี้ เป็นเพราะว่าเราจำเป็นต้อง Register Feature การแปลง POJO เป็น Json ให้ตัว Jersey รู้ก่อน ดังนี้

ที่เพิ่ม Depdency `jersey-media-json-jackson` ที่ build.gradle

```
compile "org.glassfish.jersey.media:jersey-media-json-jackson:$jerseyVersion"
```

และที่ main ก่อน start server ต้องทำดังต่อไปนี้

```java
...
ResourceConfig config = new ResourceConfig();
config.packages(“you.package.name");
config.register(JacksonFeature.class);

ServletHolder jersey = new ServletHolder(new ServletContainer(config));
...
```

เพียงเท่านี้ เมื่อเข้าที่ `localhost:2222/json` ก็จะได้ Response เป็น JSON ตามที่เราต้องการแล้ว
