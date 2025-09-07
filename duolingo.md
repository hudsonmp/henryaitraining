Platforms use following strategies to identify learners who are likely to drop out of a course, change study habits, predict exam performance, and characterize different learning strategies; ML, stats, psychometrics, Educational Data Mining (EDM), Learning Analytics.

Adjusting Duolingo Language Output to Learner's Proficency Level:

- Level of LLM output is not suitable for young children, non-native speakers, etc.
  
How do we implement a Proficency Control Task:

- Assess model ability to modulate langage proficency

1. ControlError
2. 2. QualityScore
3. Cost

Prompt-based approaches:
- Expensive!
- Instruction-tuned models perform poorly
Their solution:
- Finetune open source models
  - Mistral-7b
  - LLaMa2-7b

Proximal Policy Optimisation

One of the simplest forms of eliciting desired be-
haviour from LLMs is through clever prompting.
This approach is quick, easy to iterate, and can be
used with the most powerful proprietary models.
We explore different ways to construct prompts to
control proficiency level. Each approach builds up
in complexity by providing more useful informa-
tion about the desired proficiency level, but at the
cost of using more tokens. The full prompts for
each strategy can be found in Appendix B.2.
Baseline The simplest step to controlling profi-
ciency is to directly ask the LLM to generate at a
certain CEFR level (Base). Since LLMs are trained
on massive amounts of data, they possess context
about CEFR. For example, GPT-4 can produce
an accurate description of each CEFR level. By
prompting the model to generate at a level, it can
draw on its existing knowledge to guide generation.
Describing CEFR The next improvement over
the baseline strategy is to include concrete descrip-
tions of the CEFR levels in the prompt. Here we
can choose between describing just the target level
(Descr. (target)) or describing every single CEFR
level (Descr. (all)). The latter contains more infor-
mation but the former is more efficient in terms of
number of tokens used. We use official descriptions
of the levels from the Council of Europe, which is
the establishing body of CEFR.
Few-shot Learning Several recent results have
shown the power of including examples in the
prompt to improve LLM generation (Lewis et al.,
2020). In the context of proficiency control, we
can augment the descriptions of the CEFR levels
with an expert-written example text at that level.
As before, we can choose to include an example
for only the target level (Few (target)) or for all
CEFR levels (Few (all)).