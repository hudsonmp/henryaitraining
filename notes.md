
Encode the prompt; students get a link where they can practice the conversation

The teacher inputs the prompt that they want the students to practice on at the level of the proficiency of the students

AI must recognize the proficiency
California standard for language
ACTFL Proficiency Guidelines
Use rubrics to adapt the language learning scoring

Tools for lesson planning to find authentic resources based on topics and themes

Ideas on engaging activities
Suggestions that are easily adaptable
Not take much prep

There is a textbook that teachers learn from, but no curriculum
Guide to complete activities and themes that build on one another

At the district level there are resource teachers for some courses but not all the courses
Curriculum can be a guide but also there must be input from the teacher

Brisk AI
Gamma.app
https://speakology.ai/

Create a product that makes teachers want to improve

End-design teaching

Meet with teachers during PLC meetings working together to plan because you can observe multiple teachers

September 15th

We are building a tool for students to become more proficent in a language. Our first feature should allow a teacher to input a speaking prompt in English or Spanish for the student to practice with. This prompt will be shown to the student when they go to practice. 

Teacher:
Problem statement: Students need a better way to practice their speaking in a language they're acquiring in parallel with the class they're currently taking.
Solution: 
Write a speaking or writing prompt
Choose a voice for the LLM to interact with the student
The difficulty of the grading for beginner students should be less advanced than students taking higher level classes.
The teacher writes the prompt and selects the class level and input the rubric accordingly to the level.
The teacher should be able to write the key concpts they want the student to practice.
Teacher view so a teacher can see a students progress on the speaking and hear the
Teacher view needs to be able to assign assignments and write prompts
Input:
- Syllabus
- Prompt
- Standards
- Rubrics

Frontend - How it looks
Backend - CIRCLE BACK
Database - Stores information
API - Calls ChatGPT



We are building a platform for practicing a foreign language. The learner needs to be able to upload a rubric, select their native language and the language they're trying to learn. The native language is for the directions for the learner, and the language they are learning is for responding and listening to students. The student should also be able to the syllabus, and that should be used to determine additional information about the class. The user should also input a conversation prompt that the LLM will use to respond and guide the conversation. The LLM needs to assess the abilities of the student, but doing this without speaking is difficult, so before the student starts the converstaion, the student should select the class that they're in. To recap, the following inputs BEFORE any speaking occurs is: rubric (PDF) to get a general understanding of how advanced the LLM should be in its language responses, select their native language (english), select the language they're learning (spanish, english, french, vietnamese) and this should be a parameter of the API call, conversation prompt to guide the conversation, and the class which will be mapped to a specific learning level (Classes 1–2: Learners operate mostly in Novice Low–High, using memorized words and simple phrases to meet very basic needs.

Classes 3–4: Learners move into Intermediate Low–Mid, creating strings of sentences, asking/answering questions, and handling everyday topics.

Classes 5–6: Learners reach Intermediate Mid–High, beginning to narrate and describe in different time frames with more connected discourse.

Classes 7–8 Honors: Learners target Advanced Low, sustaining conversations, giving explanations, and beginning to support opinions.

AP Language: Learners aim for Advanced Mid–High, narrating and describing in multiple time frames, managing abstract topics, and producing extended discourse.

AP Literature: Learners push into Advanced High–Superior, analyzing texts, tailoring language to audience and purpose, and engaging in persuasive, culturally-nuanced argumentation.

This sequence shows the natural progression through the ACTFL standards).

Once all of this is inputted by the user (no optional fields), it will establish an instance with OpenAI's Realtime API for speaking with the input languages. This is how ChatGPT should interact with the user in the realtime API instance. The API instance/conversation is started by a "begin conversation" button on the frontend:
1. ChatGPT will use the class level and the rubric to determine the initial level that it should speak in. Then the next thing that open ai will say will be in the speakers learning lanquage this will show that the lession has started. The learner will now speak back as if in normal conversation in language they're learning, and the conversation will continue. If the student is less advanced, LLM should speak slowly, use more forma academic language that's likely included in the textbook, talk slower, maybe with a slightly less advanced langiage acwuitison accent, maybe emphasize the syallables. Conversley, if the student is advanced, maybe the LLM can speak faster, use a more advanced vocabulary, use slang, etc. Based on the quality of the response and demonstrated comprehension from the student, the LLM should adjust the level that it responds in realtime. The learner will continue the coversation until they press end conversation, then instance is over.

No backend or database. No authentication. Use React Next.js for the frontend and .ts files for the API routing. Consult documentation on how to establish the realtime speaking using OpenAI.

- First prompt better then make correctionsd accordingly



These are the things that adjust depending on the level: focusing on word frequency, syntactic complexity, and part-of-speech
(POS) distribution.
