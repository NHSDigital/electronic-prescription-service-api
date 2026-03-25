from app import handler


def test_hello_world(capfd):
    handler.hello_world()
    out, _ = capfd.readouterr()
    assert out == "Hello, World!\n"
