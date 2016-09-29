---
title:  "Gradle 101 - part1 Know The Gradle!"
date:   2016-02-07 15:43:38 +0700
description: Basic of gradle you should known.
published: false
---
gradle เป็น build tools สำหรับ Android ตั้งแต่เริ่มมี Android Studion เกิดขึ้น(ซึ่งก็นานแล้วนะ) ซึ่งผมที่อยู่กับมันมาก็นานแต่ก็ไม่เข้าใจมันสักที ส่วนใหญ่ก็คือไป copy script ของคนอื่นมาวาง + แก้นิดๆหน่อย แล้วก็ภาวนาให้มันผ่านก็พอ 😛 แต่พอต้องการใช้งาน Tools ต่างๆ มาขึ้น เช่น...

- Jacoco สำหรับโค้ดรายงาน CodeCoverage รวมไปถึงบริการของ Coverall
- CheckStyles เพื่อตรวจว่าโค้ดจุดไหนที่หลุดไม่ได้เขียนตาม style ของ Project บ้างรึเปล่า
- upload Library ที่มีหลาย project ย่อยขึ้น JCenter และ mavenCentral ด้วยความที่ไม่มีพื้น Gradle พอมีความต้องการอะใหม่ๆทีก็ต้องนั่งงมเป็นวันๆกว่าจะสำเร็จ

พอสำเร็จก็เข้าใจบ้างไม่เข้าใจบ้างว่าเกิดจากอะไร จึงคิดว่าถึงเวลาควรที่จะศึกษาเพิ่ม และเขียน Blog เพื่อสรุปความเข้าใจเกี่ยวกับ Gradle ไว้แล้วหละ

> Groovy

gradle นั้นใช้ภาษา groovy นะครับ ฉะนั้นถ้าพอมีพื้นฐานบ้างน่าจะไปได้เร็วกว่า ในบนความนี้ผมจะอธิบายโดย Assume ว่าคนอ่านไม่รู้จะ groovy แต่มีความสามารถจาก java ให้พอเดา script ได้นะครับ

## Build Script

หรือไฟล์ที่ชื่อว่า `build.gradle` นั้นหละครับ เป็นแกนหลักของ gradle เลยก็ว่าได้ ทุกอย่างเริ่มที่ตรงนี้หละ folder ไหนมี build script อยู่ ก็ถือว่าตรงนั้นเป็น _Project_ ดังเช่นตัวอย่างนี้

จะเห็นว่า folder `android-TanlabadSurvey` มี build.gradle อยู่ ภายใต้ folder app, entity, domain ก็มี build.gradle อยู่เช่นกัน ฉะนั้นจะหมายความว่า android-TanlabadSurvey เป็น `rootProject` โดยมี project ย่อยอีก 3 project ได้แก :app, :entity, :domain

## Project and Task

ก่อนหน้าที่มีการพูดถึง Project ไปบ้างแล้วซึ่ง Concept หลักของ gradle คือเรื่องของ Project และ Task นี้หละ

### Project

ถ้าใน Android Studio จะเรียกว่า Module แทน (แต่นี้เป็นบทความเกี่ยวกับ gradle จะขอเรียกเป็น Project ตามแบบของ gradle) ซึ่งอาจจะเป็นส่วนที่เก็บ Code หลักที่สำหรับแอพเราเขียนขึ้นมา หรืออาจจะเป็น Library หรือ Project ที่มีเฉพาะ Test สำหรับอีก Project ก็ได้

อย่างในภาพประกอบจะเป็นว่า ใน android-TanlabadSurvey จะมี 4 gradle project ได้แก่ andrid-TanlabadSurvey ซึ่งเป็น rootProject และอีก 3 project ได้แก่ :app, :entity, :domain ชื่อของ Project ย่อยโดย default จะเป็นรูปแบบ : ตามด้วยชื่อ folder ของ Project นั้น

### Task

ในแต่ละ Project จะประกอบไปด้วยอย่างน้อย 1 task ซึ่งจะมีมากหรือน้อยก็ขึ้นอยู่กับว่า Project นั้นเรา apply plug-in อะไรเข้าไปบ้าง สำหรับ Android App ที่เราคุ้ยเคยกันดีได้แก่ `com.android.application` และ `com.android.library` ซึ่งการเพิ่ม plug-in เหล่านี้มักพร้อมกับ task มากมายให้เราได้ใช้งาน

จากภาพจะเห็นว่าภายใต้ :app จะมี task ต่างๆมากมาย (ดูที่เป็นเฟืองสีฟ้า) ซึ่ง Android Studio จะแบ่ง Task ให้เราตามประเภทของ task อย่างสวยงาม ส่วนใน :domain และ :entity ซึ่งเป็น Java Project ก็จะมี Task ที่ต่างออกไปตาม plug-in ที่ project นั้นเรียกใช้

นอกจาก Task ที่ได้จาก plug-in เรายังสามารถเพิ่ม Task เอง หรือเพิ่มเติมการทำงานของ Task ที่มีอยู่แล้วได้ด้วยนะ หวังว่าผมจะไม่ขี้เกียจเขียนใน part ต่อๆไป

## Run The Task

เราสามารถเรียกใช้ทุก task ได้ด้วยการ double click ที่ชื่อ task ใน android studio ได้ง่ายๆ หรือจะเรียกใช้งานผ่าน Terminal ซึ่งจะใช้งานได้หลากหลายท่ากว่า แนะนำให้ใช้ Terminal ใน Android Studio นี้หละครับสะดวกดี อยู่ด้านล่างซ้าย เห็นกันรึเปล่า?

พอกดขึ้นมาก็พิมพ์คำสั่งประมาณนี้ `./gradlew build` ซึ่งหมายความเรียกใช้งาน task ที่ชื่อว่า `build` ในที่นี้เนื่องจากสั่ง build โดยที่เราอยู่ที่ rootProject gradle จะเข้าไปค้นหาใน project ลูกทุก Project ว่ามี task `build` หรือไม่ ถ้ามีก็สั่งให้ task นั้นเริ่มทำงานเลย

หรือเราอาจจะสั่งให้รัน task build เฉพาะที่ project :app ก้ได้นะครับ ด้วยคำสั่ง `./gradlew :app:build`

ซึ่งหลังจากที่สั่งรัน Task ไปเราเห็น log ใน Terminal เขียนในรูปแบบเดียวกับที่เราสั่งให้รันเฉพาะ task ในแต่ละ Project ดังภาพ

จากภาพเป็น log ใน terminal จากช่วงท้ายของการรันคำสั่ง `./gradlew build`

อยากให้ลองสังเกตุบรรทัดทีเขียนว่า `:app:check` ก่อน `:app:build` ซึ่งหมายความมีการ run task `check` ของ Project :app ก่อน `build` ที่เป็นเช่นนี้ก็เพราะว่า task `build` ของ :app นั้น dependOn หรือต้องทำหลังจากรัน task `check` เสร็จแล้วเท่านั้น ส่วนบรรทัดอื่นๆก็สื่อความหมายในลักษณะเดียวกัน

part นี้พอแค่นี้ก่อนเริ่มขี้เกียจแล้ว ครั้งหน้าเราจะมาทำความรู้จัก Wrapper และ Daemon กัน
