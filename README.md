# 3D ASCII Game Engine

![3D ASCII Game Engine](https://raw.githubusercontent.com/justMoritz/images/master/3d-game-engine-min.png)

## This project is an ascii-character-based 3D engine!
Based on the javidx9 code-it-yourself, but written in JavaScript for your browser, this is a quick rundown or the text-only 3D engine complete with textures, mouselook, lighting and more!

### Where can I play it?
You can download the repo, and just open the index.html file in your browser!
![3D ASCII Game Engine](https://raw.githubusercontent.com/justMoritz/images/master/3d-game-engine.gif)

## Breakdown

### Raycasting and ‘3D’
I really encourace you to check out javidx9's original project, it's a great and easy-to-follow tutorial, and goes into much depth of the calculations, maths, and theories behind a raycaster engine.

So the biggest question might be…is it 3D? Well, I would say it depends. It's not polygons, sure, but you might argue that even polygonal 3D rendering is just a 2D representation of threedimensional space. And so is this. It has more limitations than polygonal rendering, for sure. But it's still in essense the illusion of a 3D world, created in 2D pixels from a set of coordinates, just like polygonal 3D.


### Just text on a screen
This is a game engine built with nothing but mono-spaced ASCII characters, so I thought it might be a lot more fun to just have the game be actual text! As a result, that's just what it is. No JavaScript canvas here!

### Looking Up and Down
One of the most obvious limitations of rendering a 3D world not with polygons but with colums is that looking up and down is a bit tricky. After all, traditional raycaster games and even Doom had you looking straight ahead pretty much all the time.

However, after adding mouse support, I really wanted a “mouselook” feel. I guess modern 3D games just spoiled us, and it's really hard to get un-used to that. So what to do?

#### Step 1: Just Change the Height of the Ceiling and Floor
That's simple enough: While moving the mose up and down, make the ceiling and and floor taller and smaller.

![3D ASCII Game Engine](https://raw.githubusercontent.com/justMoritz/images/master/3d-look-1.gif)

Except reality doesn't really look like that. This also has the uncanny feeling of being “really zoomed in”, even when you are not.

#### Step 2: Skew the Image!
We're calculating the world column by column, so there's not really a way skew a colum to fake perspective. But what we *can* do is treat the entire output as an image, and skew that!

After the image is generated in step 1, the image is now an array of pixels, and we can now operate on a row- instead of a col-basis! And since we know how far up and down we are looking, all we have to is progressively shorten each row of pixels as we look up and down, and fill it with filler-pixels at the beginning and end.

This *sounds* simple, but the math for this was the piece I spent the longest amount of time on. While it's easy(ish) to determine how many pixels to remove from each row, figuring out how to distribute the number of pixels from each row required some mental gymnasitcs.

![3D ASCII Game Engine](https://raw.githubusercontent.com/justMoritz/images/master/3d-look-2.gif)

#### Step 3: Hide the Skew!
The last thing is to run the resulting output through another loop, and just cut off the left- and right-most pixels of each rown.

![Looking Up and Down Final Version](https://raw.githubusercontent.com/justMoritz/images/master/3d-look-final.gif)

*Tada! (Almost) 3d!*

### Render Output Modes:

The ascii engine can run in 3 render modes: Solid Walls, Textures Only and Shaded Texture.

Like the original, it started with solid Walls rendered in different shades for depth. To texture the walls, I implemented a sampler (which figures out which pixel to get from a texture based on absolute coordinates), and a texturing algorythm that figures out where to place them in the world.

While I like the look of ASCII characters as textures, they tend to be a bit…illegible if they are rendered with really large pixels, and so I wrote the ability to not only convert the ASCII text chars into solid solid ASCII chars, but also adjust the distance shading of those chars on depth.

![Different Render Modes Motion](https://raw.githubusercontent.com/justMoritz/images/master/3d-textures.gif)
![Different Render Modes Still](https://raw.githubusercontent.com/justMoritz/images/master/3d-rendermodes-min.png)


### Shaded Textures! (aka almost lighting)
I thought it might be kind of neat to have a—sorta—directional light source to give the whole world even more depth, so I adjusted the renderer to shade surfaces of certain directions to be a differnet shade than others.

![Almost Lighting](https://raw.githubusercontent.com/justMoritz/images/master/3d-shading.gif)

I still like the *idea* of using alphanumberical ascii textures more, and so in a future version, I might look increasing the solution, making the pixels smaller, and shade the world using various tables of alphanumberic chars.


### Directional Texture
At some point I decided I would make a game that took place in a grocery store. Since shelves themselves have depths, the textures for the shelves would have to have some dimension to them. My idea was to serve a different texture (with fake perspective) based on the angle the player is looking at it. The effect is subtle here, but I think it really helps sell the illusion!

![Directional Textures](https://raw.githubusercontent.com/justMoritz/images/master/3d-directional.gif)


### Asset Loader
Level data and textures are loaded from files, and can be switched on the fly!

## Not quite done yet

### Towers:
Certain blocks can be rendered taller than other blocks. This is done by rendering part of the sky as a solid. It works really nice until you start looking up and down, when it shifts, warps, and occasionally pops in and out.

![Towers](https://raw.githubusercontent.com/justMoritz/images/master/3d-towers-min.png)

### Objects:
The engine als supports what I internally call objects: Items that are neither walls nor the planes that are the ceiling and the sky. They could be water, or holes, I don't have a use-case for them yet.
They work by
- calculating the distance to the front *and* the back of a block
- rendering them into a unique screen of their own
- overlaying and combinging the two screens at render time

![Objects Composit Image](https://raw.githubusercontent.com/justMoritz/images/master/3d-composit-min.png)

### Animated Textures:
This one is actually quite simple: Every [few] frames, change the texture of a block. This code is alreay in the engine, but I have not done anything with it yet, since I don't have any good animated textures yet…


## Minor Thoughts
- i/o is written from scratch but you knew that. Running and jumping included!
- I quickly figured out that console.log-ing is super expensive. Instead, debug output is printed to a special section on the screen with it's own function. I always find it really interesting when you have find *other* solutions to problems that have already been solved.

## TODO
- Fix issues
- Sprites?
- build a half-fun game with decent art