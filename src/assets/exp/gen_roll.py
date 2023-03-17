

# load plane.png

import PIL.Image as Image
import numpy as np
import matplotlib.pyplot as plt

backgound = Image.open('plane.png')

to_roll = Image.open('rolling.png')

ROLL_JUMPS = 5

# get img with
width, height = backgound.size

def roll(img, delta):
    # to numpy array
    arr = np.asarray(img)

    # roll
    arr = np.roll(arr, delta, axis=1)

    # to image
    return Image.fromarray(arr)
    
# plot
plt.imshow(backgound)
plt.imshow(roll(to_roll, 0))


for i in range(0, width, ROLL_JUMPS):
    # create new transparent image
    new_img = Image.new('RGBA', (width, height), (0, 0, 0, 0))


    # add roll over the background
    to_roll = roll(to_roll, -ROLL_JUMPS)
    new_img.paste(to_roll, (0, 0), to_roll)

    # put background
    new_img.paste(backgound, (0, 0), backgound)


    # save
    new_img.save('tmp/roll_%d.png' % i)




