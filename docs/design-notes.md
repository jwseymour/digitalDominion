**story**

In the game you are an omniscient being however you have no physical form and your only way of interacting with the world is through telepathically communicating with the mortals.

You are able to lead the people in order to build a civilisation and progress technology and civilisation, however you have to be careful that the mortals do not realise that you are effectively a god and that you exist. 

I guess this is bad because then they'll become dependant on you or they'll make sacrifices or something.

I'll come up with a good reason as to why *they can't know about you existing, that is a crucial part*

*maybe* you were a full god (but the mythology kind, not the christian kind) and another god fought you and gravely injured you, so much so that you lost your physical body, so you're like a spirit or something. and if the other god notices a group of humans worshipping you then they'll be able to find you and finish you off completely. then you are trying to get a society to make technological progress so that you can harvest energy and be healed or something.

**mechanics**

So you have to encorauge certain behaviours in the people such that they can join together and progress, and you have to factor in their current intelligence and receptibility. it could be like investing in education or making people have certain morals such that they can work more efficiently as a society.

that would then get philosphical since you'd be instilling different values into the people to then see how their societies are affected.

maybe you could also try to start a religion, however it could be more risky for being found, and it could also lead people down the wrong path (like it did in the past for us)

I'll need to use an AI for this to work at all. One that acts as the people and that evaluates how well your tactics work, this would be far too complicated and also limitting if it was to be all hard coded.

**graphics/interface**

I made the 3d world because i had initially been thinking of building something that was more focused on making decisions for a civilisation based on the resources and terrain around, however this idea is significantly more interesting. also this kind of procedural generation has been something that I've been wanting to do for a long time, and have finally actually done.

I think it could be look nice and be cool thing to look at and track progress but I would need to have the terrains a bit different.

Originally i had been planning on creating climates and rock formations and then create the wildlife of the world based off of that since it would make it feel more natural and would be needed for the previous gameplay, however it doesn't need to be as in-depth anymore.

I want to add wildlife and other features so that it looks nicer/interesting/higher quality, however I need to be able to accurately represent the region and progress of a civilisation. 

I need to work more of the terrain generation fine tuning, so that it is a lot smoother and has less peaks and extremes.


**thinking**

also the world will be having an affect on the people/civilisation and how you are playing the game too. I will need to get a good way of passing that information into the AI.

this will end up being quite complicated. lots of the gameplay could be solely text based, especially since it is using an LLM. However the AI will need to have information on the environment passed into it, and also the actions taken and progress made will need to be reflected in the visual appearance and with how the progress is actually stored.

the AI will probably be made using OpenAI assistants and therefore will all be kept in a thread so that will have progress stored there, however it will also have to be stored outside of that. the only way i have thought of so far is creating a scoring system, where there will be a large mass of scores/stats which will be being passed back and forth. the AI will have to reply in a strict json schema.

I will also need to create another AI which is like the game keeper which is looking at everything that is going on and will then be asking the user questions so as to progress the game.

another mechanic could be with the people AI, it could evalute the users response to something and deem that at a certain point in the future another problem will occur as a result of what they chose. so with that, the local system would have to store that kind of thing.

It could come down to just having a ton of stats, that would work. However I feel that that is too limiting, if used well AI can be really flexible while still making sense. so I should try to have a mix of both a decent amount of hard stats, but also get the different AI to like write descriptions for things in plain english and then the other AIs will interpret them and it could add even more nuance and flexibility. however they have to stay within certain bounds in order for them to fit.